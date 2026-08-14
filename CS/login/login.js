/* ======================================================
   ĐĂNG NHẬP GOOGLE
====================================================== */

const googleLogin = document.getElementById("googleLogin");
const googleProvider = new firebase.auth.GoogleAuthProvider();

if (googleLogin) {

    googleLogin.addEventListener("click", async () => {

        try {

            const result =
                await auth.signInWithPopup(googleProvider);

            const user = result.user;

            const userRef =
                db.collection("users").doc(user.uid);

            const userSnap =
                await userRef.get();

            /*
             * Nếu tài khoản Google chưa có trong Firestore
             * thì tạo thông tin cơ bản.
             *
             * KHÔNG lưu role nữa.
             */

            if (!userSnap.exists) {

                await userRef.set({
                    uid: user.uid,
                    name: user.displayName || "",
                    email: user.email || "",
                    phone: "",
                    provider: "google",
                    createdAt:
                        firebase.firestore.FieldValue.serverTimestamp()
                });

            }

            const email =
                String(user.email || "")
                    .trim()
                    .toLowerCase();

            console.log("Google Email:", email);

            // ==========================================
            // ADMIN
            // ==========================================

            if (email === "hcm@admin.com") {

                toast(
                    "Đăng nhập Admin thành công!",
                    "success"
                );

                setTimeout(() => {

                    window.location.href =
                        "/ADMIN/homepage-ad.html";

                }, 400);

                return;
            }

            // ==========================================
            // CS
            // ==========================================

            if (email.endsWith("@gmail.com")) {

                toast(
                    "Đăng nhập CS thành công!",
                    "success"
                );

                setTimeout(() => {

                    window.location.href =
                        "/CS/homepageCS/trangchu-cs.html";

                }, 400);

                return;
            }

            // ==========================================
            // HỌC VIÊN
            // ==========================================

            if (email.endsWith("@student.edu.vn")) {

                toast(
                    "Đăng nhập học viên thành công!",
                    "success"
                );

                setTimeout(() => {

                    window.location.href =
                        "/HV/homepage-hv/homepage.html";

                }, 400);

                return;
            }

            // ==========================================
            // EMAIL KHÔNG HỢP LỆ
            // ==========================================

            await auth.signOut();

            toast(
                "Email chưa được phân quyền trong hệ thống.",
                "error"
            );

        } catch (error) {

            console.error(
                "Lỗi đăng nhập Google:",
                error
            );

            toast(
                getAuthErrorMessage(error),
                "error"
            );
        }

    });

}


/* ======================================================
   ĐĂNG NHẬP EMAIL / PASSWORD
====================================================== */

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    const loginBtn =
        loginForm.querySelector(".btn");

    loginForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById("loginPassword")
                    .value;

            loginBtn.disabled = true;
            loginBtn.textContent =
                "Đang xử lý...";

            try {

                // ======================================
                // FIREBASE AUTH
                // ======================================

                const result =
                    await auth.signInWithEmailAndPassword(
                        email,
                        password
                    );

                const user = result.user;

                // ======================================
                // LẤY THÔNG TIN USER
                // ======================================

                const userSnap =
                    await db
                        .collection("users")
                        .doc(user.uid)
                        .get();

                if (!userSnap.exists) {

                    await auth.signOut();

                    toast(
                        "Không tìm thấy thông tin tài khoản.",
                        "error"
                    );

                    loginBtn.disabled = false;
                    loginBtn.textContent =
                        "Đăng nhập";

                    return;
                }

                const userData =
                    userSnap.data() || {};

                /*
                 * Không còn:
                 *
                 * userData.role
                 * role === "cs"
                 * role === "student"
                 * role === "admin"
                 *
                 * Phân quyền bằng email.
                 */

                const userEmail =
                    String(user.email || email)
                        .trim()
                        .toLowerCase();

                console.log(
                    "Thông tin tài khoản:",
                    userData
                );

                console.log(
                    "Email đăng nhập:",
                    userEmail
                );


                // ======================================
                // ADMIN
                // HCM@admin.com
                // ======================================

                if (
                    userEmail === "hcm@admin.com"
                ) {

                    toast(
                        "Đăng nhập Admin thành công!",
                        "success"
                    );

                    loginBtn.textContent =
                        "Thành công!";

                    setTimeout(() => {

                        window.location.href =
                            "/ADMIN/homepage-ad.html";

                    }, 400);

                    return;
                }


                // ======================================
                // CS
                // @gmail.com
                // ======================================

                if (
                    userEmail.endsWith("@gmail.com")
                ) {

                    toast(
                        "Đăng nhập CS thành công!",
                        "success"
                    );

                    loginBtn.textContent =
                        "Thành công!";

                    setTimeout(() => {

                        window.location.href =
                            "/CS/homepageCS/trangchu-cs.html";

                    }, 400);

                    return;
                }


                // ======================================
                // HỌC VIÊN
                // @student.edu.vn
                // ======================================

                if (
                    userEmail.endsWith("@student.edu.vn")
                ) {

                    toast(
                        "Đăng nhập học viên thành công!",
                        "success"
                    );

                    loginBtn.textContent =
                        "Thành công!";

                    setTimeout(() => {

                        window.location.href =
                            "/HV/homepage-hv/homepage.html";

                    }, 400);

                    return;
                }


                // ======================================
                // EMAIL KHÔNG ĐƯỢC PHÉP
                // ======================================

                await auth.signOut();

                toast(
                    "Email chưa được phân quyền trong hệ thống.",
                    "error"
                );

                loginBtn.disabled = false;
                loginBtn.textContent =
                    "Đăng nhập";

            } catch (error) {

                console.error(
                    "Lỗi đăng nhập:",
                    error
                );

                toast(
                    getAuthErrorMessage(error),
                    "error"
                );

                loginBtn.disabled = false;
                loginBtn.textContent =
                    "Đăng nhập";
            }

        }
    );
}

/* ======================================================
   TOAST THÔNG BÁO
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

                box-shadow:
                    0 10px 30px rgba(0,0,0,.18);

                opacity: 0;
                pointer-events: none;

                transition:
                    opacity .25s ease,
                    transform .25s ease;

                z-index: 99999;
            }

            #appToast.show {
                opacity: 1;
                transform:
                    translateX(-50%)
                    translateY(0);
            }

            #appToast.toast-success {
                background: #1e824c;
            }

            #appToast.toast-error {
                background: #b3261e;
            }
        `;

        document.head.appendChild(style);
    }

    const icon =
        type === "success"
            ? "✓"
            : "✕";

    el.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
    `;

    el.className =
        `show toast-${type}`;

    clearTimeout(window.__toastTimer);

    window.__toastTimer =
        setTimeout(() => {

            el.classList.remove("show");

        }, 2600);
}


/* ======================================================
   FIREBASE AUTH ERROR
====================================================== */

function getAuthErrorMessage(error) {

    const code =
        error && error.code;

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