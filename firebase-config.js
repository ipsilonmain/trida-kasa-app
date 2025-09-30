import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDaXCsrLdejMBWznEoeiaOkxEFyRWWK1RI",
  authDomain: "trida-kasa.firebaseapp.com",
  projectId: "trida-kasa",
  storageBucket: "trida-kasa.firebasestorage.app",
  messagingSenderId: "882167279633",
  appId: "1:882167279633:web:ba5f62338ff290e01241b0",
  measurementId: "G-RQE5PYP8ME"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
