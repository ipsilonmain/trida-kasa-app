import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updatePassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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
const newStudentPassword = document.getElementById("new-student-password");
const addStudentBtn = document.getElementById("add-student-btn");
const studentsList = document.getElementById("students-list");
const payeeDropdown = document.getElementById("payee-dropdown");
const amountInput = document.getElementById("amount");
const reasonInput = document.getElementById("reason");
const addTransactionBtn = document.getElementById("add-transaction-btn");
const historyList = document.getElementById("history-list");
const historyStudentDropdown = document.getElementById("history-student-dropdown");
const showStudentHistoryBtn = document.getElementById("show-student-history-btn");
const selectedStudentHistoryList = document.getElementById("selected-student-history-list");
const logoutBtn = document.getElementById("logout-btn");

// Student elementy
const studentNameEl = document.getElementById("student-name");
const studentBalanceEl = document.getElementById("student-balance");
const studentHistoryList = document.getElementById("student-history-list");
const logoutBtnStudent = document.getElementById("logout-btn-student");
const newPasswordInput = document.getElementById("new-password");
const changePasswordBtn = document.getElementById("change-password-btn");
const passwordChangeMsg = document.getElementById("password-change-msg");

// ===================== Přihlášení =====================
loginBtn.addEventListener("click", async () => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if(!userDoc.exists()) throw new Error("Uživatel nemá přiřazenou roli.");
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

// ===================== Logout =====================
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    location.reload();
});
logoutBtnStudent.addEventListener("click", async () => {
    await signOut(auth);
    location.reload();
});

// ===================== Admin Dashboard =====================
async function showAdminDashboard(){
    loginSection.style.display = "none";
    adminDashboard.style.display = "block";
    await loadStudents();
    await loadTotalCash();
    await loadHistory();
    await loadHistoryDropdown();
}

async function loadStudents(){
    studentsList.innerHTML = "";
    payeeDropdown.innerHTML = '<option value="">Vyber žáka</option>';
    const studentsSnapshot = await getDocs(collection(db, "students"));
    studentsSnapshot.forEach(docSnap => {
        const li = document.createElement("li");
        li.textContent = `${docSnap.data().name} - ${docSnap.data().balance || 0} Kč`;
        studentsList.appendChild(li);

        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = docSnap.data().name;
        payeeDropdown.appendChild(option);
    });
}

async function loadTotalCash(){
    let total = 0;
    const studentsSnapshot = await getDocs(collection(db, "students"));
    studentsSnapshot.forEach(docSnap => {
        total += docSnap.data().balance || 0;
    });
    totalCashEl.textContent = total;
}

// Přidání studenta
addStudentBtn.addEventListener("click", async () => {
    const name = newStudentName.value.trim();
    const email = newStudentEmail.value.trim();
    const password = newStudentPassword.value.trim();

    if(!name || !email || !password) return alert("Vyplň jméno, email a heslo!");

    try {
        const studentDocRef = await addDoc(collection(db, "students"), { name: name, balance: 0 });
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), { role: "student", studentId: studentDocRef.id });

        alert(`Student vytvořen!\nEmail: ${email}\nHeslo: ${password}`);

        newStudentName.value = "";
        newStudentEmail.value = "";
        newStudentPassword.value = "";
        await loadStudents();
        await loadTotalCash();
        await loadHistoryDropdown();
    } catch(e) {
        alert("Chyba při vytváření studenta: " + e.message);
    }
});

// Přidání transakce
addTransactionBtn.addEventListener("click", async () => {
    const studentId = payeeDropdown.value;
    const amount = Number(amountInput.value);
    const reason = reasonInput.value.trim();
    if(!studentId || !amount) return alert("Vyber žáka a zadej částku!");

    const studentDoc = await getDoc(doc(db, "students", studentId));
    const newBalance = (studentDoc.data().balance || 0) + amount;

    await updateDoc(doc(db, "students", studentId), { balance: newBalance });
    await addDoc(collection(db, "students", studentId, "transactions"), {
        amount: amount,
        type: amount>0?"platba":"vyber",
        reason: reason,
        timestamp: new Date()
    });

    amountInput.value = "";
    reasonInput.value = "";
    await loadStudents();
    await loadTotalCash();
    await loadHistory();
});

// Historie všech studentů
async function loadHistory(){
    historyList.innerHTML = "";
    const studentsSnapshot = await getDocs(collection(db, "students"));
    for(const docSnap of studentsSnapshot.docs){
        const transactionsSnap = await getDocs(collection(db, "students", docSnap.id, "transactions"));
        transactionsSnap.forEach(tx => {
            const li = document.createElement("li");
            li.textContent = `${docSnap.data().name}: ${tx.data().amount} Kč (${tx.data().type}) - ${tx.data().reason || ''} - ${tx.data().timestamp.toDate().toLocaleString()}`;
            historyList.appendChild(li);
        });
    }
}

// Dropdown pro zobrazení historie konkrétního studenta
async function loadHistoryDropdown(){
    historyStudentDropdown.innerHTML = '<option value="">Vyber žáka</option>';
    const studentsSnapshot = await getDocs(collection(db, "students"));
    studentsSnapshot.forEach(docSnap => {
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = docSnap.data().name;
        historyStudentDropdown.appendChild(option);
    });
}

showStudentHistoryBtn.addEventListener("click", async () => {
    const studentId = historyStudentDropdown.value;
    if(!studentId) return alert("Vyber žáka.");
    selectedStudentHistoryList.innerHTML = "";

    const transactionsSnap = await getDocs(collection(db, "students", studentId, "transactions"));
    transactionsSnap.forEach(tx => {
        const li = document.createElement("li");
        li.textContent = `${tx.data().amount} Kč (${tx.data().type}) - ${tx.data().reason || ''} - ${tx.data().timestamp.toDate().toLocaleString()}`;
        selectedStudentHistoryList.appendChild(li);
    });
});

// ===================== Student Dashboard =====================
export async function showStudentDashboard(studentId){
    loginSection.style.display = "none";
    studentDashboard.style.display = "block";

    const studentDoc = await getDoc(doc(db, "students", studentId));
    if(!studentDoc.exists()) return;

    studentNameEl.textContent = studentDoc.data().name;
    studentBalanceEl.textContent = studentDoc.data().balance || 0;

    const transactionsSnap = await getDocs(collection(db, "students", studentId, "transactions"));
    studentHistoryList.innerHTML = "";
    transactionsSnap.forEach(tx => {
        const li = document.createElement("li");
        li.textContent = `${tx.data().amount} Kč (${tx.data().type}) - ${tx.data().reason || ''} - ${tx.data().timestamp.toDate().toLocaleString()}`;
        studentHistoryList.appendChild(li);
    });
}

// ===================== Změna hesla =====================
changePasswordBtn.addEventListener("click", async () => {
    const newPassword = newPasswordInput.value.trim();
    if(!newPassword) return alert("Zadej nové heslo!");

    try {
        const user = auth.currentUser;
        if(!user) throw new Error("Uživatel není přihlášen.");

        await updatePassword(user, newPassword);
        passwordChangeMsg.textContent = "Heslo bylo úspěšně změněno!";
        newPasswordInput.value = "";
    } catch(e) {
        console.error(e);
        passwordChangeMsg.textContent = "Chyba při změně hesla: " + e.message;
    }
});
