import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import {
  generateDailyReport,
  generateWeeklyReport,
} from "../utils/journalUtils";
import { generateMonthlyReport } from "../utils/reportScheduler";

/**
 * Hook principal du journal StudyTrack.
 * Gère la lecture/écriture des journal_entries dans Firestore.
 * Génère automatiquement le rapport du jour si absent.
 */
export default function useJournal(user, tasks, habits, currentStreak) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayEntry, setTodayEntry] = useState(null);

  // Écoute en temps réel toutes les entrées de l'utilisateur
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "journal_entries"),
      where("uid", "==", user.uid),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
      // Trier par date décroissante
      list.sort((a, b) =>
        (b.periodStart || "").localeCompare(a.periodStart || ""),
      );
      setEntries(list);
      setLoading(false);

      // Identifier l'entrée du jour
      const today = dayjs().format("YYYY-MM-DD");
      const todays = list.find(
        (e) => e.type === "daily" && e.periodStart === today,
      );
      setTodayEntry(todays || null);
    });
    return () => unsub();
  }, [user]);

  /**
   * Génère et sauvegarde le rapport du jour s'il n'existe pas encore.
   * Appelé depuis JournalPage à chaque visite.
   */
  const ensureTodayReport = useCallback(async () => {
    if (!user) return;
    const today = dayjs().format("YYYY-MM-DD");

    try {
      // Pour éviter de charger tous les documents ou d'utiliser un index composite,
      // on utilise l'ID du document de manière déterministe.
      const docId = `daily_${user.uid}_${today}`;
      const docRef = doc(db, "journal_entries", docId);

      // On peut aussi chercher s'il existe une entrée avec l'ancien système d'ID aléatoire
      const existingToday = entries.find(
        (e) => e.type === "daily" && e.periodStart === today,
      );
      if (existingToday) return;

      // 1. Fetch pomodoro sessions for today
      let pomodoroData = { totalSessions: 0, totalDuration: 0 };
      try {
        const pQ = query(
          collection(db, "pomodoro_sessions"),
          where("uid", "==", user.uid),
        );
        const pSnap = await getDocs(pQ);
        const todaySessions = pSnap.docs
          .map((d) => d.data())
          .filter((s) => s.completedAt?.startsWith(today));
        pomodoroData = {
          totalSessions: todaySessions.length,
          totalDuration: todaySessions.reduce(
            (acc, curr) => acc + (curr.duration || 25),
            0,
          ),
        };
      } catch (e) {
        console.warn("Failed to fetch pomodoro sessions", e);
      }

      // Génère et sauvegarde
      const report = generateDailyReport({
        tasks,
        habits,
        pomodoroData,
        currentStreak,
        dateStr: today,
      });

      // We use setDoc with merge instead of addDoc to avoid duplicates
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        docRef,
        {
          uid: user.uid,
          ...report,
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error(
        "Erreur lors de la génération du rapport quotidien:",
        error,
      );
    }
  }, [user, tasks, habits, currentStreak, entries]);

  /**
   * Met à jour l'humeur et/ou la note personnelle d'une entrée.
   */
  const updateEntry = useCallback(async (entryId, data) => {
    if (!entryId) return;
    await updateDoc(doc(db, "journal_entries", entryId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  /**
   * Récupère les entrées quotidiennes d'une semaine donnée (lun–dim).
   */
  const getWeekEntries = useCallback(
    (weekStart) => {
      const start = dayjs(weekStart);
      const dates = Array.from({ length: 7 }, (_, i) =>
        start.add(i, "day").format("YYYY-MM-DD"),
      );
      return entries.filter(
        (e) => e.type === "daily" && dates.includes(e.periodStart),
      );
    },
    [entries],
  );

  /**
   * Récupère les entrées quotidiennes d'un mois donné.
   */
  const getMonthEntries = useCallback(
    (year, month) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return entries.filter(
        (e) => e.type === "daily" && (e.periodStart || "").startsWith(prefix),
      );
    },
    [entries],
  );

  /**
   * Génère et sauvegarde le rapport hebdomadaire d'une semaine donnée.
   */
  const ensureWeekReport = useCallback(
    async (weekStart, weekEnd) => {
      if (!user) return;
      const existing = entries.find(
        (e) => e.type === "weekly" && e.periodStart === weekStart,
      );
      if (existing) return;

      const dailyReports = getWeekEntries(weekStart);
      if (dailyReports.length === 0) return;

      const report = generateWeeklyReport({ dailyReports, weekStart, weekEnd });
      if (!report) return;

      await addDoc(collection(db, "journal_entries"), {
        uid: user.uid,
        ...report,
        createdAt: new Date().toISOString(),
      });
    },
    [user, entries, getWeekEntries],
  );

  /**
   * Génère et sauvegarde le rapport mensuel d'un mois donné.
   */
  const ensureMonthReport = useCallback(
    async (year, month) => {
      if (!user) return;

      const monthStart = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
      const monthStartStr = monthStart.format("YYYY-MM-DD");

      const existing = entries.find(
        (e) => e.type === "monthly" && e.periodStart === monthStartStr,
      );
      if (existing) return;

      const dailyReports = getMonthEntries(year, month);
      if (dailyReports.length === 0) return;

      const report = generateMonthlyReport({ dailyReports, year, month });
      if (!report) return;

      await addDoc(collection(db, "journal_entries"), {
        uid: user.uid,
        ...report,
        createdAt: new Date().toISOString(),
      });
    },
    [user, entries, getMonthEntries],
  );

  // Filtres rapides
  const dailyEntries = entries.filter((e) => e.type === "daily");
  const weeklyEntries = entries.filter((e) => e.type === "weekly");
  const monthlyEntries = entries.filter((e) => e.type === "monthly");

  return {
    entries,
    dailyEntries,
    weeklyEntries,
    monthlyEntries,
    todayEntry,
    loading,
    ensureTodayReport,
    ensureWeekReport,
    ensureMonthReport,
    updateEntry,
    getWeekEntries,
    getMonthEntries,
  };
}
