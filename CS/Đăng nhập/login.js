const container = document.getElementById("container");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

/* Trang này chỉ có form đăng nhập, không có showRegister/showLogin
   nên cần kiểm tra tồn tại trước khi gắn sự kiện — nếu không, lỗi
   null sẽ chặn toàn bộ phần code phía dưới (toggle mật khẩu, submit
   form...) không chạy được. */
if (showRegister) {
    showRegister.addEventListener("click", () => {
        container.classList.add("active");
    });
}
if (showLogin) {
    showLogin.addEventListener("click", () => {
        container.classList.remove("active");
    });
}

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
if (registerPassword) {
    registerPassword.addEventListener("input", () => {
        const value = registerPassword.value;
        let score = 0;
        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        console.log("Password Strength:", score);
    });
}

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
   TOAST THÔNG BÁO (thay cho alert() mặc định của trình duyệt)
====================================================== */
function toast(message, type = "success") {
    let el = document.getElementById("appToast");
    if (!el) {
        el = document.createElement("div");
        el.id = "appToast";
        document.body.appendChild(el);

        const style = document.createElement("style");
        style.textContent = `
            #appToast {
                position: fixed;
                left: 50%;
                bottom: 30px;
                transform: translateX(-50%) translateY(20px);
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 13px 20px;
                border-radius: 10px;
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                font-weight: 500;
                color: #fff;
                box-shadow: 0 10px 30px rgba(0,0,0,.18);
                opacity: 0;
                pointer-events: none;
                transition: opacity .25s ease, transform .25s ease;
                z-index: 99999;
            }
            #appToast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            #appToast.toast-success { background: #1e824c; }
            #appToast.toast-error { background: #b3261e; }
        `;
        document.head.appendChild(style);
    }

    const icon = type === "success" ? "✓" : "✕";
    el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    el.className = `show toast-${type}`;

    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
        el.classList.remove("show");
    }, 2600);
}

/* ======================================================
   DỊCH LỖI FIREBASE SANG TIẾNG VIỆT
====================================================== */
function getAuthErrorMessage(error) {
    const code = error && error.code;
    switch (code) {
        case "auth/invalid-email":
            return "Email không hợp lệ.";
        case "auth/user-disabled":
            return "Tài khoản này đã bị vô hiệu hóa.";
        case "auth/user-not-found":
            return "Không tìm thấy tài khoản với email này.";
        case "auth/wrong-password":
            return "Sai mật khẩu. Vui lòng thử lại.";
        case "auth/invalid-credential":
            return "Email hoặc mật khẩu không đúng.";
        case "auth/too-many-requests":
            return "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.";
        case "auth/network-request-failed":
            return "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
        case "auth/popup-closed-by-user":
            return "Cửa sổ đăng nhập Google đã bị đóng.";
        case "auth/operation-not-allowed":
            return "Phương thức đăng nhập này chưa được bật trong Firebase.";
        default:
            return "Đã có lỗi xảy ra. Vui lòng thử lại.";
    }
}

/* ======================================================
   ĐĂNG NHẬP GOOGLE
====================================================== */
const googleLogin = document.getElementById("googleLogin");
const googleProvider = new firebase.auth.GoogleAuthProvider();

if (googleLogin) {
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

            toast("Đăng nhập thành công!", "success");
            setTimeout(() => {
                window.location.href = "/HỌC VIÊN/account-HV.html";
            }, 400);

        } catch (error) {
            console.error("Lỗi đăng nhập Google:", error);
            toast(getAuthErrorMessage(error), "error");
        }
    });
}

/* ======================================================
   ĐĂNG NHẬP (Email/Password)
====================================================== */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const loginBtn = loginForm.querySelector(".btn");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        loginBtn.disabled = true;
        loginBtn.textContent = "Đang xử lý...";

        try {
            // Đăng nhập Firebase
            const result = await auth.signInWithEmailAndPassword(email, password);
            const user = result.user;

            toast("Đăng nhập thành công!", "success");

            loginBtn.textContent = "Thành công!";

            setTimeout(() => {

                // ==========================================
                // PHÂN QUYỀN THEO EMAIL
                // ==========================================

                if (email.endsWith("@student.edu.vn")) {

                    // Học viên
                    window.location.href = "/HỌC VIÊN/account-HV.html";

                } else if (email.endsWith("@gmail.com")) {

                    // CS
                    window.location.href = "/CS/Trang chủ/Trang chủ.html";

                } else {

                    // Email không thuộc hệ thống
                    auth.signOut();

                    toast(
                        "Email không được phép đăng nhập vào hệ thống.",
                        "error"
                    );

                    loginBtn.disabled = false;
                    loginBtn.textContent = "Đăng nhập";
                }

            }, 400);

        } catch (error) {
            console.error("Lỗi đăng nhập:", error);

            toast(getAuthErrorMessage(error), "error");

            loginBtn.disabled = false;
            loginBtn.textContent = "Đăng nhập";
        }
    });
}

