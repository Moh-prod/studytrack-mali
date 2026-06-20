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

/**
 * Calcule la prochaine date d'occurrence pour une tâche récurrente.
 * @param currentDate - Date actuelle de la tâche (YYYY-MM-DD)
 * @param interval - Intervalle de récurrence
 */
function getNextRecurringDate(currentDate, interval) {
  const base = currentDate ? dayjs(currentDate) : dayjs();
  switch (interval) {
    case "daily":
      return base.add(1, "day").format("YYYY-MM-DD");
    case "weekly":
      return base.add(7, "day").format("YYYY-MM-DD");
    case "monthly":
      return base.add(1, "month").format("YYYY-MM-DD");
    default:
      return base.add(1, "day").format("YYYY-MM-DD");
  }
}

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: true,
  unsub: null,

  initTasks: (user) => {
    // Cleanup previous subscription if exists
    const currentUnsub = get().unsub;
    if (currentUnsub) {
      currentUnsub();
    }

    if (!user) {
      set({ tasks: [], loading: false, unsub: null });
      return;
    }

    set({ loading: true });
    const q = query(collection(db, "tasks"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const lst = [];
      snapshot.forEach((d) => lst.push({ ...d.data(), id: d.id }));
      set({ tasks: lst, loading: false });
    });

    set({ unsub });
  },

  addTask: async (user, data) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "tasks"), {
        uid: user.uid,
        text: "",
        date: "",
        done: false,
        priority: "medium",
        category: "personal",
        status: "todo",
        subtasks: [],
        createdAt: new Date().toISOString(),
        completedAt: null,
        notified: false,
        notes: "",
        estimatedTime: null,
        recurring: false,
        recurringInterval: null,
        ...data,
      });
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Erreur lors de l'ajout de la tâche : " + error.message);
    }
  },

  updateTask: async (id, data) => {
    try {
      await updateDoc(doc(db, "tasks", id), data);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  },

  deleteTask: async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  },

  /**
   * Toggle l'état done d'une tâche.
   * Si la tâche est récurrente et qu'on la marque comme done,
   * une nouvelle occurrence est automatiquement créée avec la prochaine date.
   */
  toggleTask: async (task) => {
    const newDone = !task.done;
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        done: newDone,
        status: newDone ? "done" : "todo",
        completedAt: newDone ? new Date().toISOString() : null,
      });

      // Si la tâche est récurrente et vient d'être complétée,
      // créer la prochaine occurrence automatiquement
      if (newDone && task.recurring && task.recurringInterval) {
        const nextDate = getNextRecurringDate(
          task.date,
          task.recurringInterval,
        );
        await addDoc(collection(db, "tasks"), {
          uid: task.uid,
          text: task.text,
          date: nextDate,
          done: false,
          priority: task.priority || "medium",
          category: task.category || "personal",
          status: "todo",
          subtasks: (task.subtasks || []).map((sub) => ({
            ...sub,
            done: false, // Reset les sous-tâches
          })),
          createdAt: new Date().toISOString(),
          completedAt: null,
          notified: false,
          notes: task.notes || "",
          estimatedTime: task.estimatedTime || null,
          recurring: true,
          recurringInterval: task.recurringInterval,
        });
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  },
}));

export default useTaskStore;
