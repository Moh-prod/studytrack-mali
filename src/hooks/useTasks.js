import { useState, useEffect } from 'react';
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

  const addTask = async (data) => {
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
  };

  const updateTask = async (id, data) => {
    try {
      await updateDoc(doc(db, 'tasks', id), data);
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Erreur lors de la mise à jour de la tâche : " + error.message);
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Erreur lors de la suppression de la tâche : " + error.message);
    }
  };

  const toggleTask = async (task) => {
    const newDone = !task.done;
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        done: newDone,
        status: newDone ? 'done' : 'todo',
        completedAt: newDone ? new Date().toISOString() : null,
      });
    } catch (error) {
      console.error("Error toggling task:", error);
      alert("Erreur lors de la modification du statut : " + error.message);
    }
  };

  return { tasks, loading, addTask, updateTask, deleteTask, toggleTask };
}
