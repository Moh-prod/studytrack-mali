import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function useTasks(user) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'tasks'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const lst = [];
      snapshot.forEach((d) => lst.push({ ...d.data(), id: d.id }));
      setTasks(lst);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Stable references via useCallback — prevents child re-renders when App re-renders
  const addTask = useCallback(async (data) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        uid: user.uid,
        text: '',
        date: '',
        done: false,
        priority: 'medium',
        category: 'personal',
        status: 'todo',
        subtasks: [],
        createdAt: new Date().toISOString(),
        completedAt: null,
        notified: false,
        ...data,
      });
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Erreur lors de l'ajout de la tâche : " + error.message);
    }
  }, [user]);

  const updateTask = useCallback(async (id, data) => {
    try {
      await updateDoc(doc(db, 'tasks', id), data);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }, []);

  const toggleTask = useCallback(async (task) => {
    const newDone = !task.done;
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        done: newDone,
        status: newDone ? 'done' : 'todo',
        completedAt: newDone ? new Date().toISOString() : null,
      });
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  }, []);

  return { tasks, loading, addTask, updateTask, deleteTask, toggleTask };
}
