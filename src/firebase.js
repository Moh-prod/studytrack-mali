import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCRXQYiWlIaZi3Mmkf1Zqy2TVfCCL8IdaA",
  authDomain: "studytrack-mali.firebaseapp.com",
  projectId: "studytrack-mali"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);