// Nahraď hodnotami ze svého Firebase projektu
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "TVŮJ_API_KEY",
    authDomain: "TVŮJ_PROJECT_ID.firebaseapp.com",
    projectId: "TVŮJ_PROJECT_ID",
    storageBucket: "TVŮJ_PROJECT_ID.appspot.com",
    messagingSenderId: "TVÉ_SENDER_ID",
    appId: "TVÉ_APP_ID"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
