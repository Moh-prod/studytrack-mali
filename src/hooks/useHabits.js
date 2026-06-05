import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function useHabits(user) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'habits'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const lst = [];
      snapshot.forEach((d) => lst.push({ ...d.data(), id: d.id }));
      setHabits(lst);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Stable references — prevents child re-renders when App re-renders
  const addHabit = useCallback(async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'habits'), {
      uid: user.uid,
      name: '',
      icon: '⭐',
      color: '#7C3AED',
      completedDates: [],
      createdAt: new Date().toISOString(),
      ...data,
    });
  }, [user]);

  const updateHabit = useCallback(async (id, data) => {
    await updateDoc(doc(db, 'habits', id), data);
  }, []);

  const deleteHabit = useCallback(async (id) => {
    await deleteDoc(doc(db, 'habits', id));
  }, []);

  const toggleHabitDate = useCallback(async (habit, dateStr) => {
    const dates = habit.completedDates || [];
    const newDates = dates.includes(dateStr)
      ? dates.filter((d) => d !== dateStr)
      : [...dates, dateStr];
    await updateDoc(doc(db, 'habits', habit.id), { completedDates: newDates });
  }, []);

  return { habits, loading, addHabit, updateHabit, deleteHabit, toggleHabitDate };
}
