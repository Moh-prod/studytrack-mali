import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function useTransactions(user) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const lst = [];
      snapshot.forEach((d) => {
        lst.push({ ...d.data(), id: d.id });
      });
      // Sort by date descending
      lst.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(lst);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const addTransaction = async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'transactions'), {
      uid: user.uid,
      amount: 0,
      type: 'expense', // 'expense' | 'income'
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      description: '',
      createdAt: new Date().toISOString(),
      ...data,
    });
  };

  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  return { transactions, loading, addTransaction, deleteTransaction };
}
