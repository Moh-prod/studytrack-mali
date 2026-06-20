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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
