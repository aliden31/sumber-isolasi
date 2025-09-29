// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, query } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUQlkRsahgO4u6JDEEimkEtHMeMCii1dY",
  authDomain: "studio-744538801-63042.firebaseapp.com",
  projectId: "studio-744538801-63042",
  storageBucket: "studio-744538801-63042.appspot.com",
  messagingSenderId: "176230956015",
  appId: "1:176230956015:web:cbb150d81a07cc4dd4d41a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
