import { create } from "zustand";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";

/** Nombre de jours d'historique conservés dans completedDates */
const HISTORY_DAYS = 90;

/**
 * Nettoie le tableau completedDates en ne gardant que les N derniers jours.
 * Évite la croissance indéfinie du document Firestore (limite 1 MB/document).
 */
function pruneCompletedDates(dates) {
  const cutoff = dayjs().subtract(HISTORY_DAYS, "day").format("YYYY-MM-DD");
  return (dates || []).filter((d) => d >= cutoff);
}

const useHabitStore = create((set, get) => ({
  habits: [],
  loading: true,
  unsub: null,

  initHabits: (user) => {
    const currentUnsub = get().unsub;
    if (currentUnsub) {
      currentUnsub();
    }

    if (!user) {
      set({ habits: [], loading: false, unsub: null });
      return;
    }

    set({ loading: true });
    const q = query(collection(db, "habits"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const lst = [];
      snapshot.forEach((d) => lst.push({ ...d.data(), id: d.id }));
      set({ habits: lst, loading: false });
    });

    set({ unsub });
  },

  addHabit: async (user, data) => {
    if (!user) return;
    await addDoc(collection(db, "habits"), {
      uid: user.uid,
      name: "",
      icon: "⭐",
      color: "#7C3AED",
      completedDates: [],
      frequency: "daily",
      createdAt: new Date().toISOString(),
      ...data,
    });
  },

  updateHabit: async (id, data) => {
    try {
      await updateDoc(doc(db, "habits", id), data);
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  },

  deleteHabit: async (id) => {
    try {
      await deleteDoc(doc(db, "habits", id));
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  },

  /**
   * Toggle la date d'une habitude.
   * Prune automatiquement l'historique pour rester sous 90 jours
   * et éviter la croissance indéfinie du document Firestore.
   */
  toggleHabitDate: async (habit, dateStr) => {
    const dates = habit.completedDates || [];
    let newDates = dates.includes(dateStr)
      ? dates.filter((d) => d !== dateStr)
      : [...dates, dateStr];
    // Nettoyage: on ne garde que les 90 derniers jours
    newDates = pruneCompletedDates(newDates);
    try {
      await updateDoc(doc(db, "habits", habit.id), {
        completedDates: newDates,
      });
    } catch (error) {
      console.error("Error toggling habit date:", error);
    }
  },
}));

export default useHabitStore;
