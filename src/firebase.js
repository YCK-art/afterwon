// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVrej5YxKB1b-ISO6Ph6JWaJRBdj6uwN4",
  authDomain: "afterwon-6d17f.firebaseapp.com",
  projectId: "afterwon-6d17f",
  storageBucket: "afterwon-6d17f.firebasestorage.app",
  messagingSenderId: "888226248439",
  appId: "1:888226248439:web:cab86f23e6d2a89b9485f2",
  measurementId: "G-QL8ESNLKB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

export default app; 