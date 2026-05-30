import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function useNotes(user) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'notes'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const lst = [];
      snapshot.forEach((d) => lst.push({ ...d.data(), id: d.id }));
      setNotes(lst);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const addNote = async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'notes'), {
      uid: user.uid,
      title: '',
      content: '',
      color: '#7C3AED',
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    });
  };

  const updateNote = async (id, data) => {
    await updateDoc(doc(db, 'notes', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteNote = async (id) => {
    await deleteDoc(doc(db, 'notes', id));
  };

  const togglePin = async (note) => {
    await updateDoc(doc(db, 'notes', note.id), { pinned: !note.pinned });
  };

  return { notes, loading, addNote, updateNote, deleteNote, togglePin };
}
