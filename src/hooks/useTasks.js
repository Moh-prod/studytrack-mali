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
  };

  const updateTask = async (id, data) => {
    await updateDoc(doc(db, 'tasks', id), data);
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const toggleTask = async (task) => {
    const newDone = !task.done;
    await updateDoc(doc(db, 'tasks', task.id), {
      done: newDone,
      status: newDone ? 'done' : 'todo',
      completedAt: newDone ? new Date().toISOString() : null,
    });
  };

  return { tasks, loading, addTask, updateTask, deleteTask, toggleTask };
}
