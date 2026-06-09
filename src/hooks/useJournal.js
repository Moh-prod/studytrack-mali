import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import { generateDailyReport, generateWeeklyReport } from '../utils/journalUtils';

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
      collection(db, 'journal_entries'),
      where('uid', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
      // Trier par date décroissante
      list.sort((a, b) => (b.periodStart || '').localeCompare(a.periodStart || ''));
      setEntries(list);
      setLoading(false);

      // Identifier l'entrée du jour
      const today = dayjs().format('YYYY-MM-DD');
      const todays = list.find((e) => e.type === 'daily' && e.periodStart === today);
      setTodayEntry(todays || null);
    });
    return () => unsub();
  }, [user]);

  /**
   * Génère et sauvegarde le rapport du jour s'il n'existe pas encore.
   * Appelé depuis JournalPage à chaque visite.
   */
  const ensureTodayReport = useCallback(async (pomodoroData) => {
    if (!user) return;
    const today = dayjs().format('YYYY-MM-DD');

    // Vérifie si déjà existant
    const q = query(
      collection(db, 'journal_entries'),
      where('uid', '==', user.uid),
      where('type', '==', 'daily'),
      where('periodStart', '==', today)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return; // Déjà généré aujourd'hui

    // Génère et sauvegarde
    const report = generateDailyReport({ tasks, habits, pomodoroData, currentStreak, dateStr: today });
    await addDoc(collection(db, 'journal_entries'), {
      uid: user.uid,
      ...report,
      createdAt: new Date().toISOString(),
    });
  }, [user, tasks, habits, currentStreak]);

  /**
   * Met à jour l'humeur et/ou la note personnelle d'une entrée.
   */
  const updateEntry = useCallback(async (entryId, data) => {
    if (!entryId) return;
    await updateDoc(doc(db, 'journal_entries', entryId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  /**
   * Récupère les entrées quotidiennes d'une semaine donnée (lun–dim).
   */
  const getWeekEntries = useCallback((weekStart) => {
    const start = dayjs(weekStart);
    const dates = Array.from({ length: 7 }, (_, i) =>
      start.add(i, 'day').format('YYYY-MM-DD')
    );
    return entries.filter(
      (e) => e.type === 'daily' && dates.includes(e.periodStart)
    );
  }, [entries]);

  /**
   * Récupère les entrées quotidiennes d'un mois donné.
   */
  const getMonthEntries = useCallback((year, month) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return entries.filter(
      (e) => e.type === 'daily' && (e.periodStart || '').startsWith(prefix)
    );
  }, [entries]);

  /**
   * Génère et sauvegarde le rapport hebdomadaire d'une semaine donnée.
   */
  const ensureWeekReport = useCallback(async (weekStart, weekEnd) => {
    if (!user) return;
    const existing = entries.find(
      (e) => e.type === 'weekly' && e.periodStart === weekStart
    );
    if (existing) return;

    const dailyReports = getWeekEntries(weekStart);
    if (dailyReports.length === 0) return;

    const report = generateWeeklyReport({ dailyReports, weekStart, weekEnd });
    if (!report) return;

    await addDoc(collection(db, 'journal_entries'), {
      uid: user.uid,
      ...report,
      createdAt: new Date().toISOString(),
    });
  }, [user, entries, getWeekEntries]);

  // Filtres rapides
  const dailyEntries = entries.filter((e) => e.type === 'daily');
  const weeklyEntries = entries.filter((e) => e.type === 'weekly');

  return {
    entries,
    dailyEntries,
    weeklyEntries,
    todayEntry,
    loading,
    ensureTodayReport,
    ensureWeekReport,
    updateEntry,
    getWeekEntries,
    getMonthEntries,
  };
}
