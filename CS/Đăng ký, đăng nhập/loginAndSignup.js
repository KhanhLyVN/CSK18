const container = document.getElementById("container");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

showRegister.addEventListener("click", () => {
    container.classList.add("active");
});
showLogin.addEventListener("click", () => {
    container.classList.remove("active");
});

const toggleButtons = document.querySelectorAll(".toggle-password");
toggleButtons.forEach(button => {
    button.addEventListener("click", () => {
        const input = button.previousElementSibling;
        const icon = button.querySelector("i");
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});

const registerPassword = document.getElementById("registerPassword");
registerPassword.addEventListener("input", () => {
    const value = registerPassword.value;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    console.log("Password Strength:", score);
});

const inputs = document.querySelectorAll("input");
inputs.forEach(input => {
    input.addEventListener("focus", () => {
        input.parentElement.style.transform = "scale(1.02)";
    });
    input.addEventListener("blur", () => {
        input.parentElement.style.transform = "scale(1)";
    });
});

const buttons = document.querySelectorAll(".btn");
buttons.forEach(btn => {
    btn.addEventListener("mouseenter", () => {
        btn.style.boxShadow = "0 12px 25px rgba(30,58,95,.25)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.boxShadow = "none";
    });
});

window.addEventListener("load", () => {
    document.body.style.opacity = "1";
});

/* ======================================================
   ĐĂNG NHẬP GOOGLE
====================================================== */
const googleLogin = document.getElementById("googleLogin");
// const googleProvider = new firebase.auth.GoogleAuthProvider();

googleLogin.addEventListener("click", async () => {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        const userRef = db.collection("users").doc(user.uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            await userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                phone: "",
                role: "student",
                provider: "google",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        alert("Đăng nhập thành công!");
        window.location.href = "index.html";

    } catch (error) {
        console.error("Lỗi đăng nhập Google:", error);
        alert(getAuthErrorMessage(error));
    }
});

/* ======================================================
   ĐĂNG NHẬP (Email/Password)
====================================================== */
const loginForm = document.getElementById("loginForm");
const loginBtn = loginForm.querySelector(".btn");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    loginBtn.disabled = true;
    loginBtn.textContent = "Đang xử lý...";

    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert("Đăng nhập thành công!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        alert(getAuthErrorMessage(error));
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Đăng nhập";
    }
});