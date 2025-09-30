<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDaXCsrLdejMBWznEoeiaOkxEFyRWWK1RI",
    authDomain: "trida-kasa.firebaseapp.com",
    projectId: "trida-kasa",
    storageBucket: "trida-kasa.firebasestorage.app",
    messagingSenderId: "882167279633",
    appId: "1:882167279633:web:ba5f62338ff290e01241b0",
    measurementId: "G-RQE5PYP8ME"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
