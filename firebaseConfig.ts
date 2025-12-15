import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- COLE AQUI AS CHAVES QUE VOCÊ COPIOU DO FIREBASE ---
export const firebaseConfig = {
  apiKey: "AIzaSyDrmuO3z11UGcgkKcqJ7Y0nEAaWi1i8pgw",             // Ex: AIzaSyD...
  authDomain: "pastoraldemusica-e7830.firebaseapp.com",
  projectId: "pastoraldemusica-e7830",
  storageBucket: "pastoraldemusica-e7830.firebasestorage.app",
  messagingSenderId: "15607429628",
  appId: "1:15607429628:web:370c0cca7508a5d3359a79",
  measurementId: "G-CP2K1X75MM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);