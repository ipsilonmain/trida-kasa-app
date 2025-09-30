import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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
const newStudentEmail = document.getElementById("new-student-email");
const addStudentBtn = document.getElementById("add-student-btn");
const studentsList = document.getElementById("students-list");
const payeeDropdown = document.getElementById("payee-dropdown");
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
    await loadHistory();
}

// Načtení žáků a naplnění dropdownu
async function loadStudents(){
    studentsList.innerHTML = "";
    payeeDropdown.innerHTML = '<option value="">Vyber žáka</option>';

    const studentsSnapshot = await getDocs(collection(db, "students"));
    for (const docSnap of studentsSnapshot.docs) {
        const li = document.createElement("li");
        li.textContent = `${docSnap.data().name} - ${docSnap.data().balance || 0} Kč`;
        studentsList.appendChild(li);

        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = docSnap.data().name;
        payeeDropdown.appendChild(option);
    }
}

// Celková kasa
async function loadTotalCash(){
    let total = 0;
    const studentsSnapshot = await getDocs(collection(db, "students"));
    studentsSnapshot.forEach(docSnap => { total += docSnap.data().balance || 0; });
    totalCashEl.textContent = total;
}

// Přidání žáka s emailem pro login
addStudentBtn.addEventListener("click", async () => {
    const name = newStudentName.value.trim();
    const email = newStudentEmail.value.trim();
    if(!name || !email) return alert("Vyplň jméno a email");

    // vytvoření dokumentu studenta
    const studentDocRef = await addDoc(collection(db, "students"), { name: name, balance: 0 });

    // vytvoření uživatele ve Firebase Auth
    const tempPassword = Math.random().toString(36).slice(-8); // dočasné heslo
    const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);

    // přiřazení role student
    await setDoc(doc(db, "users", userCredential.user.uid), { role: "student", studentId: studentDocRef.id });

    newStudentName.value = "";
    newStudentEmail.value = "";
    loadStudents();
});

// Přidání transakce s dropdown
addTransactionBtn.addEventListener("click", async () => {
    const studentId = payeeDropdown.value;
    const amount = Number(amountInput.value);
    const reason = reasonInput.value.trim();
    if(!studentId || !amount || !reason) return alert("Vyplň všechny údaje");

    const studentDoc = await getDoc(doc(db, "students", studentId));
    if(!studentDoc.exists()) return alert("Žák nenalezen");

    const newBalance = (studentDoc.data().balance || 0) + amount;
    await updateDoc(doc(db, "students", studentId), { balance: newBalance });

    await addDoc(collection(db, "students", studentId, "transactions"), {
        amount: amount,
        type: amount>0 ? "platba" : "vyber",
        reason: reason,
        timestamp: new Date()
    });

    amountInput.value = "";
    reasonInput.value = "";

    loadStudents();
    loadTotalCash();
    loadHistory();
});

// Historie admina s čitelným datumem a odebráním
const loadHistory = async () => {
    historyList.innerHTML = "";

    const studentsSnapshot = await getDocs(collection(db, "students"));
    for (const studentDoc of studentsSnapshot.docs) {
        const transactionsSnap = await getDocs(collection(db, "students", studentDoc.id, "transactions"));
        for (const txDoc of transactionsSnap.docs) {
            const tx = txDoc.data();
            const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp || Date.now());
            const formattedDate = `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${date.getFullYear()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;

            const li = document.createElement("li");
            li.textContent = `${studentDoc.data().name}: ${tx.amount} Kč (${tx.type}) - ${tx.reason} - ${formattedDate}`;

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Odebrat";
            removeBtn.style.marginLeft = "10px";
            removeBtn.addEventListener("click", async () => {
                await deleteDoc(doc(db, "students", studentDoc.id, "transactions", txDoc.id));
                const updatedBalance = (studentDoc.data().balance || 0) - tx.amount;
                await updateDoc(doc(db, "students", studentDoc.id), { balance: updatedBalance });
                await loadStudents();
                await loadTotalCash();
                await loadHistory();
            });

            li.appendChild(removeBtn);
            historyList.appendChild(li);
        }
    }
};

// ===================== Student Dashboard =====================
async function showStudentDashboard(studentId){
    loginSection.style.display = "none";
    studentDashboard.style.display = "block";

    const studentDoc = await getDoc(doc(db, "students", studentId));
    if(!studentDoc.exists()) return;

    studentNameEl.textContent = studentDoc.data().name;
    studentBalanceEl.textContent = studentDoc.data().balance || 0;

    const transactionsSnap = await getDocs(collection(db, "students", studentId, "transactions"));
    studentHistoryList.innerHTML = "";
    for (const txDoc of transactionsSnap.docs) {
        const tx = txDoc.data();
        const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp || Date.now());
        const formattedDate = `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${date.getFullYear()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;

        const li = document.createElement("li");
        li.textContent = `${tx.amount} Kč (${tx.type}) - ${tx.reason} - ${formattedDate}`;
        studentHistoryList.appendChild(li);
    }
}

const historyStudentDropdown = document.getElementById("history-student-dropdown");
const showStudentHistoryBtn = document.getElementById("show-student-history-btn");
const selectedStudentHistoryList = document.getElementById("selected-student-history-list");

// Naplnění dropdownu žáky
async function loadHistoryDropdown() {
    historyStudentDropdown.innerHTML = '<option value="">Vyber žáka</option>';
    const studentsSnapshot = await getDocs(collection(db, "students"));
    studentsSnapshot.forEach(docSnap => {
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = docSnap.data().name;
        historyStudentDropdown.appendChild(option);
    });
}

// Zobrazení historie vybraného žáka
showStudentHistoryBtn.addEventListener("click", async () => {
    const studentId = historyStudentDropdown.value;
    if(!studentId) return alert("Vyber žáka");

    selectedStudentHistoryList.innerHTML = "";

    const transactionsSnap = await getDocs(collection(db, "students", studentId, "transactions"));
    for(const txDoc of transactionsSnap.docs){
        const tx = txDoc.data();
        const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp || Date.now());
        const formattedDate = `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${date.getFullYear()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;

        const li = document.createElement("li");
        li.textContent = `${tx.amount} Kč (${tx.type}) - ${tx.reason} - ${formattedDate}`;
        selectedStudentHistoryList.appendChild(li);
    }
});

// Zavolat při načtení admin dashboardu
loadHistoryDropdown();
