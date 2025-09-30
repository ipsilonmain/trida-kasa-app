// ====== FIREBASE SDK IMPORT ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, onSnapshot } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ====== TVŮJ FIREBASE CONFIG ======
const firebaseConfig = {
  apiKey: "TVŮJ_API_KEY",
  authDomain: "TVŮJ_PROJECT.firebaseapp.com",
  projectId: "TVŮJ_PROJECT_ID",
  storageBucket: "TVŮJ_PROJECT.appspot.com",
  messagingSenderId: "TVŮJ_SENDER_ID",
  appId: "TVŮJ_APP_ID",
  measurementId: "TVŮJ_MEASUREMENT_ID"
};

// ====== INITIALIZACE FIREBASE ======
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ====== DOM ELEMENTY ======
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginError = document.getElementById("login-error");

const studentList = document.getElementById("student-list");
const paymentList = document.getElementById("payment-list");
const cashTotal = document.getElementById("cash-total");
const historyList = document.getElementById("history-list");

const addStudentBtn = document.getElementById("add-student");
const addPaymentBtn = document.getElementById("add-payment");

// ====== LOGIN ======
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
  } catch (err) {
    loginError.innerText = "Chyba: " + err.message;
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.classList.remove("active");
    appScreen.classList.add("active");
    startApp();
  } else {
    appScreen.classList.remove("active");
    loginScreen.classList.add("active");
  }
});

// ====== APP LOGIKA ======
async function startApp() {
  const kasaDoc = doc(db, "kasa", "data");

  // Pokud dokument neexistuje, vytvoříme prázdnou strukturu
  const snapshot = await getDoc(kasaDoc);
  if (!snapshot.exists()) {
    await setDoc(kasaDoc, { students: [], payments: [], history: [] });
  }

  // Realtime update
  onSnapshot(kasaDoc, (snap) => {
    const data = snap.data();
    renderStudents(data.students);
    renderPayments(data.payments, data.students);
    renderHistory(data.history);
    renderCash(data.students, data.payments);
  });

  // Přidání žáka
  addStudentBtn.onclick = async () => {
    const name = prompt("Jméno žáka:");
    if (!name) return;
    await updateDoc(kasaDoc, {
      students: arrayUnion({ name, paid: {} }),
      history: arrayUnion(`${new Date().toLocaleString()}: Přidán žák ${name}`)
    });
  };

  // Přidání platby
  addPaymentBtn.onclick = async () => {
    const label = prompt("Název platby:");
    const amount = prompt("Částka:");
    if (!label || !amount) return;
    await updateDoc(kasaDoc, {
      payments: arrayUnion({ label, amount: parseInt(amount) }),
      history: arrayUnion(`${new Date().toLocaleString()}: Přidána platba ${label} - ${amount} Kč`)
    });
  };
}

// ====== RENDER FUNKCE ======
function renderStudents(students) {
  studentList.innerHTML = "";
  students.forEach(s => {
    const div = document.createElement("div");
    div.textContent = s.name;
    studentList.appendChild(div);
  });
}

function renderPayments(payments, students) {
  paymentList.innerHTML = "";
  payments.forEach(p => {
    const div = document.createElement("div");
    div.className = "payment";
    div.innerHTML = `<strong>${p.label}</strong> – ${p.amount} Kč`;

    // Seznam žáků s checkboxy
    students.forEach(s => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = s.paid && s.paid[p.label];
      checkbox.onchange = () => togglePayment(s.name, p.label, checkbox.checked);
      div.appendChild(document.createElement("br"));
      div.appendChild(document.createTextNode(s.name + ": "));
      div.appendChild(checkbox);
    });

    paymentList.appendChild(div);
  });
}

async function togglePayment(studentName, paymentLabel, paid) {
  const kasaDoc = doc(db, "kasa", "data");
  const snap = await getDoc(kasaDoc);
  const data = snap.data();

  const students = data.students.map(s => {
    if (s.name === studentName) {
      if (!s.paid) s.paid = {};
      s.paid[paymentLabel] = paid;
    }
    return s;
  });

  await updateDoc(kasaDoc, {
    students,
    history: arrayUnion(`${new Date().toLocaleString()}: ${studentName} ${paid ? "zaplatil" : "odznačeno"} ${paymentLabel}`)
  });
}

function renderCash(students, payments) {
  let total = 0;
  payments.forEach(p => {
    students.forEach(s => {
      if (s.paid && s.paid[p.label]) {
        total += p.amount;
      }
    });
  });
  cashTotal.innerText = `${total} Kč`;
}

function renderHistory(history) {
  historyList.innerHTML = "";
  history.slice().reverse().forEach(h => {
    const li = document.createElement("li");
    li.textContent = h;
    historyList.appendChild(li);
  });
}
