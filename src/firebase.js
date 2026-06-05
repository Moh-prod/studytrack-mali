import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCRXQYiWlIaZi3Mmkf1Zqy2TVfCCL8IdaA",
  authDomain: "studytrack-mali.firebaseapp.com",
  projectId: "studytrack-mali"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence — data is cached locally in IndexedDB.
// The app works offline and syncs when connection is restored.
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — persistence only works in one tab at a time.
    console.warn('Firestore persistence unavailable (multiple tabs).');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence.
    console.warn('Firestore persistence not supported in this browser.');
  }
});