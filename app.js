import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// HTML elementy
const loginSection = document.getElementById("login-section");
const adminDashboard = document.getElementById("admin-dashboard");
const studentDashboard = document.getElementById("student-dashboard");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginMsg = document.getElementById("login-msg");

// Admin elementy
const totalCashEl = document.getElementById("total-cash");
const newStudentName = document.getElementById("new-student-name");
const addStudentBtn = document.getElementById("add-student-btn");
const studentsList = document.getElementById("students-list");
const payeeInput = document.getElementById("payee");
const amountInput = document.getElementById("amount");
const reasonInput = document.getElementById("reason");
const addTransactionBtn = document.getElementById("add-transaction-btn");
const historyList = document.getElementById("history-list");
const logoutBtn = document.getElementById("logout-btn");

// Student elementy
const studentNameEl = document.getElementById("student-name");
const studentBalanceEl = document.getElementById("student-balance");
const studentHistoryList = document.getElementById("student-history-list");
const logoutBtnStudent = document.getElementById("logout-btn-student");

// ===================== Přihlášení =====================
loginBtn.addEventListener("click", async () => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) throw new Error("Uživatel nemá přiřazenou roli.");
        const role = userDoc.data().role;

        if(role === "admin"){
            showAdminDashboard();
        } else {
            showStudentDashboard(userDoc.data().studentId);
        }
    } catch (e) {
        loginMsg.textContent = "Chyba při přihlášení: " + e.message;
    }
});

// Logout
logoutBtn.addEventListener("click", async () => { await signOut(auth); location.reload(); });
logoutBtnStudent.addEventListener("click", async () => { await signOut(auth); location.reload(); });

// ===================== Admin Dashboard =====================
async function showAdminDashboard(){
    loginSection.style.display = "none";
    adminDashboard.style.display = "block";
    await loadStudents();
    await loadTotalCash();
    
}

// Načtení žáků
async function loadStudents(){
    studentsList.innerHTML = "";
    const studentsSnapshot = await getDocs(collection(db, "students"));
    studentsSnapshot.forEach(docSnap => {
        const li = document.createElement("li");
        li.textContent = `${docSnap.data().name} - ${docSnap.data().balance || 0} Kč`;
        studentsList.appendChild(li);
    });
}

// Celková kasa
async function loadTotalCash(){
    let total = 0;
    const studentsSnapshot = await getDocs(collection(db, "students"));
    studentsSnapshot.forEach(docSnap => { total += docSnap.data().balance || 0; });
    totalCashEl.textContent = total;
}

// Přidání žáka
addStudentBtn.addEventListener("click", async () => {
    if(newStudentName.value.trim() === "") return;
    await addDoc(collection(db, "students"), { name: newStudentName.value.trim(), balance: 0 });
    newStudentName.value = "";
    loadStudents();
});

// Přidání transakce s důvodem
addTransactionBtn.addEventListener("click", async () => {
    const studentName = payeeInput.value.trim();
    const amount = Number(amountInput.value);
    const reason = reasonInput.value.trim();
    if(!studentName || !amount || !reason) return alert("Vyplň všechny údaje!");

    const studentsSnapshot = await getDocs(collection(db, "students"));
    let studentId = null;
    let studentBalance = 0;
    studentsSnapshot.forEach(docSnap => {
        if(docSnap.data().name === studentName){
            studentId = docSnap.id;
            studentBalance = docSnap.data().balance || 0;
        }
    });
    if(!studentId) return alert("Žák nenalezen");

    const newBalance = studentBalance + amount;
    await updateDoc(doc(db, "students", studentId), { balance: newBalance });

    await addDoc(collection(db, "students", studentId, "transactions"), {
