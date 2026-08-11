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
   ĐĂNG KÝ (Email/Password)
====================================================== */
const registerForm = document.getElementById("registerForm");
const registerBtn = registerForm.querySelector(".btn");

function getAuthErrorMessage(error) {
    switch (error.code) {
        case "auth/email-already-in-use":
            return "Email này đã được đăng ký. Vui lòng đổi email khác hoặc đăng nhập.";
        case "auth/weak-password":
            return "Mật khẩu quá yếu, vui lòng dùng tối thiểu 6 ký tự.";
        case "auth/invalid-email":
            return "Định dạng email không hợp lệ.";
        case "auth/user-not-found":
            return "Tài khoản không tồn tại với email này.";
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Email hoặc mật khẩu không đúng.";
        case "auth/too-many-requests":
            return "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.";
        case "auth/network-request-failed":
            return "Lỗi kết nối mạng. Vui lòng kiểm tra lại Internet.";
        default:
            return "Đã xảy ra lỗi: " + error.message;
    }
}

// Kiểm tra định dạng số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
function isValidVNPhone(phone) {
    return /^0\d{9}$/.test(phone);
}

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }

    // Validate số điện thoại nếu người dùng có nhập
    if (phone && !isValidVNPhone(phone)) {
        alert("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 số, bắt đầu bằng số 0.");
        document.getElementById("registerPhone").focus();
        return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Đang xử lý...";

    try {
        // // Kiểm tra email đã tồn tại chưa
        // const methods = await auth.fetchSignInMethodsForEmail(email);
        // if (methods.length > 0) {
        //     alert("Email này đã được đăng ký. Vui lòng đổi email khác hoặc đăng nhập.");
        //     document.getElementById("registerEmail").focus();
        //     return;
        // }

        // Kiểm tra số điện thoại đã tồn tại chưa (nếu có nhập)
        if (phone) {
            const phoneCheck = await db.collection("users")
                .where("phone", "==", phone)
                .limit(1)
                .get();
            if (!phoneCheck.empty) {
                alert("Số điện thoại này đã được sử dụng. Vui lòng đổi số khác.");
                document.getElementById("registerPhone").focus();
                return;
            }
        }

        const result = await auth.createUserWithEmailAndPassword(email, password);

        await db.collection("users").doc(result.user.uid).set({
            uid: result.user.uid,
            name: name,
            email: email,
            phone: phone,
            role: "student",
            provider: "email",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Đăng ký thành công!");
        registerForm.reset();
        container.classList.remove("active");

    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        alert(getAuthErrorMessage(error));
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = "Đăng ký";
    }
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