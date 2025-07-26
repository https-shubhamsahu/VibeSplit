// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQj6ya-qoDxN-qQRVFxtlLLY16vOhHK58",
  authDomain: "vibesplit-0011.firebaseapp.com",
  projectId: "vibesplit-0011",
  storageBucket: "vibesplit-0011.appspot.com", // <-- fix: should be .appspot.com
  messagingSenderId: "979849899034",
  appId: "1:979849899034:web:a80a1432f2a40c2bd735a3",
  measurementId: "G-XKSB4JXD7B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);