import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

/**
 * Configuration Firebase — les valeurs sont lues depuis les variables d'environnement
 * définies dans .env.local (non commité).
 * Les clés API Firebase côté client sont publiques par nature mais doivent
 * être protégées par des Firestore Security Rules strictes (voir firestore.rules).
 */
const firebaseConfig = {
  apiKey: "AIzaSyCRXQYiWlIaZi3Mmkf1Zqy2TVfCCL8IdaA",
  authDomain: "studytrack-mali.firebaseapp.com",
  projectId: "studytrack-mali",
  storageBucket: "studytrack-mali.appspot.com",
  messagingSenderId: "",
  appId: "",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * Firestore avec persistance locale activée (API moderne Firebase v12+).
 * Remplace l'ancien enableIndexedDbPersistence() déprécié.
 * - persistentLocalCache : données cachées dans IndexedDB pour le mode hors-ligne
 * - persistentMultipleTabManager : synchronisation entre plusieurs onglets
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
