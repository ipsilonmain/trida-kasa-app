// Nahraď hodnotami ze svého Firebase projektu
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDaXCsrLdejMBWznEoeiaOkxEFyRWWK1RI",
    authDomain: "trida-kasa.firebaseapp.com",
    projectId: "trida-kasa",
    storageBucket: "trida-kasa.firebasestorage.app",
    messagingSenderId: "882167279633",
    appId: "1:882167279633:web:ba5f62338ff290e01241b0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
