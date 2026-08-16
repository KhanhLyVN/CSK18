/* ======================================================
   SUPPORT CENTER - LOGIN
   Firebase:
   - Authentication
   - Firestore
   - Google Authentication

   KHÔNG THAY ĐỔI firebase-config.js
====================================================== */

"use strict";


/* ======================================================
   FIREBASE CHECK
====================================================== */

function getFirebaseAuth() {

    if (
        typeof auth !== "undefined" &&
        auth
    ) {
        return auth;
    }

    if (
        typeof firebase !== "undefined" &&
        firebase.apps &&
        firebase.apps.length
    ) {
        return firebase.auth();
    }

    return null;
}


function getFirebaseDB() {

    if (
        typeof db !== "undefined" &&
        db
    ) {
        return db;
    }

    if (
        typeof firebase !== "undefined" &&
        firebase.apps &&
        firebase.apps.length
    ) {
        return firebase.firestore();
    }

    return null;
}


/* ======================================================
   GLOBAL FIREBASE
====================================================== */

const firebaseAuth = getFirebaseAuth();
const firestoreDB = getFirebaseDB();


/* ======================================================
   DEBUG FIREBASE
====================================================== */

function debugFirebase() {

    try {

        if (
            typeof firebase === "undefined" ||
            !firebase.apps ||
            !firebase.apps.length
        ) {

            console.error(
                "Firebase chưa được initialize."
            );

            return;
        }

        console.log(
            "========================================"
        );

        console.log(
            "Firebase Project:",
            firebase.app().options.projectId
        );

        console.log(
            "Firebase Auth Domain:",
            firebase.app().options.authDomain
        );

        console.log(
            "Firebase Storage Bucket:",
            firebase.app().options.storageBucket
        );

        console.log(
            "Firebase App:",
            firebase.app().name
        );

        console.log(
            "========================================"
        );

    } catch (error) {

        console.error(
            "Không thể kiểm tra Firebase:",
            error
        );
    }
}


/* ======================================================
   DOM READY
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        debugFirebase();

        setupPasswordToggle();

        setupGoogleLogin();

        setupEmailPasswordLogin();

    }
);


/* ======================================================
   PASSWORD TOGGLE
====================================================== */

function setupPasswordToggle() {

    const toggle =
        document.querySelector(
            ".toggle-password"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    if (
        !toggle ||
        !passwordInput
    ) {
        return;
    }

    toggle.addEventListener(
        "click",
        () => {

            const icon =
                toggle.querySelector("i");

            if (
                passwordInput.type ===
                "password"
            ) {

                passwordInput.type =
                    "text";

                if (icon) {

                    icon.classList.remove(
                        "fa-eye"
                    );

                    icon.classList.add(
                        "fa-eye-slash"
                    );
                }

            } else {

                passwordInput.type =
                    "password";

                if (icon) {

                    icon.classList.remove(
                        "fa-eye-slash"
                    );

                    icon.classList.add(
                        "fa-eye"
                    );
                }
            }

        }
    );
}


/* ======================================================
   GOOGLE LOGIN
====================================================== */

function setupGoogleLogin() {

    const googleLogin =
        document.getElementById(
            "googleLogin"
        );

    if (!googleLogin) {
        return;
    }

    googleLogin.addEventListener(
        "click",
        async () => {

            if (!firebaseAuth) {

                toast(
                    "Firebase Authentication chưa sẵn sàng.",
                    "error"
                );

                return;
            }

            if (!firestoreDB) {

                toast(
                    "Firestore chưa sẵn sàng.",
                    "error"
                );

                return;
            }

            googleLogin.disabled = true;

            const oldText =
                googleLogin.innerHTML;

            googleLogin.innerHTML =
                `<i class="fa-solid fa-spinner fa-spin"></i>
                 Đang đăng nhập...`;

            try {

                /* ======================================
                   GOOGLE PROVIDER
                ====================================== */

                const provider =
                    new firebase.auth.GoogleAuthProvider();

                provider.setCustomParameters({
                    prompt: "select_account"
                });


                /* ======================================
                   GOOGLE POPUP
                ====================================== */

                const result =
                    await firebaseAuth
                        .signInWithPopup(
                            provider
                        );

                const user =
                    result.user;

                if (!user) {

                    throw new Error(
                        "Firebase không trả về user."
                    );
                }


                console.log(
                    "========================================"
                );

                console.log(
                    "GOOGLE LOGIN"
                );

                console.log(
                    "UID:",
                    user.uid
                );

                console.log(
                    "Email:",
                    user.email
                );

                console.log(
                    "========================================"
                );


                /* ======================================
                   FIRESTORE USER
                ====================================== */

                const account =
                    await findUserProfile(
                        user
                    );


                /* ======================================
                   KHÔNG CÓ PROFILE
                ====================================== */

                if (!account) {

                    await safeSignOut();

                    toast(
                        "Tài khoản Google chưa được cấp quyền trong hệ thống.",
                        "error"
                    );

                    googleLogin.disabled =
                        false;

                    googleLogin.innerHTML =
                        oldText;

                    return;
                }


                const userData =
                    account.data;


                console.log(
                    "Google Firestore profile:",
                    userData
                );


                /* ======================================
                   STATUS
                ====================================== */

                if (
                    userData.status &&
                    userData.status !==
                        "active"
                ) {

                    await safeSignOut();

                    toast(
                        "Tài khoản hiện không hoạt động.",
                        "error"
                    );

                    googleLogin.disabled =
                        false;

                    googleLogin.innerHTML =
                        oldText;

                    return;
                }


                /* ======================================
                   ADMIN
                ====================================== */

                if (
                    userData.accountType ===
                        "admin" &&
                    userData.role ===
                        "admin"
                ) {

                    toast(
                        "Đăng nhập Admin thành công!",
                        "success"
                    );

                    setTimeout(
                        () => {

                            window.location.href =
                                "/ADMIN/homepage-ad.html";

                        },
                        500
                    );

                    return;
                }


                /* ======================================
                   CUSTOMER SUCCESS
                ====================================== */

                if (
                    userData.accountType ===
                    "customer_success"
                ) {

                    toast(
                        "Đăng nhập CS thành công!",
                        "success"
                    );

                    setTimeout(
                        () => {

                            window.location.href =
                                "/CS/homepageCS/trangchu-cs.html";

                        },
                        500
                    );

                    return;
                }


                /* ======================================
                   STUDENT
                ====================================== */

                if (
                    userData.accountType ===
                    "student"
                ) {

                    toast(
                        "Đăng nhập học viên thành công!",
                        "success"
                    );

                    setTimeout(
                        () => {

                            window.location.href =
                                "/HV/homepage-hv/homepage.html";

                        },
                        500
                    );

                    return;
                }


                /* ======================================
                   KHÔNG ĐƯỢC PHÂN QUYỀN
                ====================================== */

                console.error(
                    "Tài khoản Google không được phân quyền:",
                    userData
                );

                await safeSignOut();

                toast(
                    "Tài khoản chưa được phân quyền trong hệ thống.",
                    "error"
                );

                googleLogin.disabled =
                    false;

                googleLogin.innerHTML =
                    oldText;

            } catch (error) {

                console.error(
                    "Lỗi đăng nhập Google:",
                    error
                );

                toast(
                    getAuthErrorMessage(error),
                    "error"
                );

                googleLogin.disabled =
                    false;

                googleLogin.innerHTML =
                    oldText;
            }

        }
    );
}


/* ======================================================
   EMAIL / PASSWORD LOGIN
====================================================== */

function setupEmailPasswordLogin() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    if (!loginForm) {
        return;
    }

    const loginBtn =
        loginForm.querySelector(
            ".btn"
        );

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            /* ==========================================
               INPUT
            ========================================== */

            const emailInput =
                document.getElementById(
                    "loginEmail"
                );

            const passwordInput =
                document.getElementById(
                    "loginPassword"
                );

            if (
                !emailInput ||
                !passwordInput
            ) {

                toast(
                    "Không tìm thấy ô đăng nhập.",
                    "error"
                );

                return;
            }


            const email =
                String(
                    emailInput.value || ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    passwordInput.value || ""
                );


            /* ==========================================
               VALIDATE
            ========================================== */

            if (!email) {

                toast(
                    "Vui lòng nhập email.",
                    "error"
                );

                emailInput.focus();

                return;
            }


            if (!password) {

                toast(
                    "Vui lòng nhập mật khẩu.",
                    "error"
                );

                passwordInput.focus();

                return;
            }


            /* ==========================================
               FIREBASE CHECK
            ========================================== */

            if (!firebaseAuth) {

                toast(
                    "Firebase Authentication chưa sẵn sàng.",
                    "error"
                );

                console.error(
                    "firebaseAuth không tồn tại."
                );

                return;
            }


            if (!firestoreDB) {

                toast(
                    "Firestore chưa sẵn sàng.",
                    "error"
                );

                console.error(
                    "firestoreDB không tồn tại."
                );

                return;
            }


            /* ==========================================
               BUTTON
            ========================================== */

            if (loginBtn) {

                loginBtn.disabled =
                    true;

                loginBtn.textContent =
                    "Đang đăng nhập...";
            }


            try {

                /* ======================================
                   1. FIREBASE AUTH
                ====================================== */

                console.log(
                    "========================================"
                );

                console.log(
                    "BẮT ĐẦU ĐĂNG NHẬP"
                );

                console.log(
                    "Email:",
                    email
                );

                console.log(
                    "Firebase Project:",
                    firebase.app().options.projectId
                );

                console.log(
                    "========================================"
                );


                const result =
                    await firebaseAuth
                        .signInWithEmailAndPassword(
                            email,
                            password
                        );


                const user =
                    result.user;


                if (!user) {

                    throw new Error(
                        "Firebase Authentication không trả về user."
                    );
                }


                console.log(
                    "Firebase Auth thành công."
                );

                console.log(
                    "Auth UID:",
                    user.uid
                );

                console.log(
                    "Auth Email:",
                    user.email
                );


                /* ======================================
                   2. FIRESTORE PROFILE
                ====================================== */

                const account =
                    await findUserProfile(
                        user
                    );


                /* ======================================
                   3. KHÔNG TÌM THẤY PROFILE
                ====================================== */

                if (!account) {

                    console.error(
                        "Không tìm thấy users theo UID hoặc email."
                    );

                    await safeSignOut();

                    toast(
                        "Tài khoản đã đăng nhập Firebase nhưng chưa được cấp quyền trong hệ thống.",
                        "error"
                    );

                    resetLoginButton(
                        loginBtn
                    );

                    return;
                }


                /* ======================================
                   USER DATA
                ====================================== */

                const userData =
                    account.data;


                console.log(
                    "========================================"
                );

                console.log(
                    "FIRESTORE USER"
                );

                console.log(
                    "Document ID:",
                    account.docId
                );

                console.log(
                    "User Data:",
                    userData
                );

                console.log(
                    "========================================"
                );


                /* ======================================
                   4. KIỂM TRA EMAIL
                ====================================== */

                const authEmail =
                    String(
                        user.email || email
                    )
                        .trim()
                        .toLowerCase();

                const firestoreEmail =
                    String(
                        userData.email || ""
                    )
                        .trim()
                        .toLowerCase();


                if (
                    firestoreEmail &&
                    firestoreEmail !==
                        authEmail
                ) {

                    console.error(
                        "Email không khớp:",
                        {
                            authEmail:
                                authEmail,

                            firestoreEmail:
                                firestoreEmail
                        }
                    );

                    await safeSignOut();

                    toast(
                        "Email Firebase và hồ sơ tài khoản không khớp.",
                        "error"
                    );

                    resetLoginButton(
                        loginBtn
                    );

                    return;
                }


                /* ======================================
                   5. STATUS
                ====================================== */

                if (
                    userData.status &&
                    userData.status !==
                        "active"
                ) {

                    console.warn(
                        "Account status:",
                        userData.status
                    );

                    await safeSignOut();

                    toast(
                        "Tài khoản hiện không hoạt động.",
                        "error"
                    );

                    resetLoginButton(
                        loginBtn
                    );

                    return;
                }


                /* ======================================
                   6. ADMIN
                ====================================== */

                if (
                    userData.accountType ===
                        "admin" &&
                    userData.role ===
                        "admin"
                ) {

                    console.log(
                        "========================================"
                    );

                    console.log(
                        "ADMIN LOGIN SUCCESS"
                    );

                    console.log(
                        "========================================"
                    );


                    toast(
                        "Đăng nhập Admin thành công!",
                        "success"
                    );


                    if (loginBtn) {

                        loginBtn.textContent =
                            "Thành công!";
                    }


                    setTimeout(
                        () => {

                            window.location.href =
                                "/ADMIN/homepage-ad.html";

                        },
                        500
                    );

                    return;
                }


                /* ======================================
                   7. CUSTOMER SUCCESS
                ====================================== */

                if (
                    userData.accountType ===
                    "customer_success"
                ) {

                    console.log(
                        "========================================"
                    );

                    console.log(
                        "CUSTOMER SUCCESS LOGIN"
                    );

                    console.log(
                        "========================================"
                    );


                    toast(
                        "Đăng nhập CS thành công!",
                        "success"
                    );


                    if (loginBtn) {

                        loginBtn.textContent =
                            "Thành công!";
                    }


                    setTimeout(
                        () => {

                            window.location.href =
                                "/CS/homepageCS/trangchu-cs.html";

                        },
                        500
                    );

                    return;
                }


                /* ======================================
                   8. STUDENT
                ====================================== */

                if (
                    userData.accountType ===
                    "student"
                ) {

                    console.log(
                        "========================================"
                    );

                    console.log(
                        "STUDENT LOGIN"
                    );

                    console.log(
                        "========================================"
                    );


                    toast(
                        "Đăng nhập học viên thành công!",
                        "success"
                    );


                    if (loginBtn) {

                        loginBtn.textContent =
                            "Thành công!";
                    }


                    setTimeout(
                        () => {

                            window.location.href =
                                "/HV/homepage-hv/homepage.html";

                        },
                        500
                    );

                    return;
                }


                /* ======================================
                   9. KHÔNG ĐƯỢC PHÂN QUYỀN
                ====================================== */

                console.error(
                    "ACCOUNT TYPE KHÔNG HỢP LỆ:",
                    {
                        uid:
                            user.uid,

                        email:
                            authEmail,

                        accountType:
                            userData.accountType,

                        role:
                            userData.role,

                        status:
                            userData.status
                    }
                );


                await safeSignOut();


                toast(
                    "Tài khoản chưa được phân quyền trong hệ thống.",
                    "error"
                );


                resetLoginButton(
                    loginBtn
                );

            } catch (error) {

                console.error(
                    "========================================"
                );

                console.error(
                    "LỖI ĐĂNG NHẬP"
                );

                console.error(
                    error
                );

                console.error(
                    "Code:",
                    error?.code
                );

                console.error(
                    "Message:",
                    error?.message
                );

                console.error(
                    "========================================"
                );


                toast(
                    getAuthErrorMessage(
                        error
                    ),
                    "error"
                );


                resetLoginButton(
                    loginBtn
                );
            }

        }
    );
}


/* ======================================================
   FIND USER PROFILE
======================================================

   Ưu tiên:

   1. users/{Firebase Auth UID}

   Nếu không tồn tại:

   2. users where email == Firebase Auth email

   Điều này xử lý trường hợp Firestore document
   trước đây được tạo bằng ID khác UID.
====================================================== */

async function findUserProfile(user) {

    if (!user) {
        return null;
    }

    if (!firestoreDB) {

        console.error(
            "Firestore chưa sẵn sàng."
        );

        return null;
    }


    const uid =
        String(
            user.uid || ""
        ).trim();


    const email =
        String(
            user.email || ""
        )
            .trim()
            .toLowerCase();


    console.log(
        "----------------------------------------"
    );

    console.log(
        "TÌM USER PROFILE"
    );

    console.log(
        "UID:",
        uid
    );

    console.log(
        "Email:",
        email
    );

    console.log(
        "----------------------------------------"
    );


    /* ==================================================
       CÁCH 1 - UID
    ================================================== */

    if (uid) {

        try {

            const uidRef =
                firestoreDB
                    .collection("users")
                    .doc(uid);


            const uidSnap =
                await uidRef.get();


            console.log(
                "Kiểm tra users/" + uid
            );

            console.log(
                "Exists:",
                uidSnap.exists
            );


            if (uidSnap.exists) {

                const data =
                    uidSnap.data() || {};


                console.log(
                    "Tìm thấy user bằng UID."
                );


                return {

                    docId:
                        uidSnap.id,

                    data:
                        data,

                    method:
                        "uid"
                };
            }

        } catch (error) {

            console.error(
                "Lỗi đọc users/{uid}:",
                error
            );

        }
    }


    /* ==================================================
       CÁCH 2 - EMAIL
    ================================================== */

    if (email) {

        try {

            console.warn(
                "Không tìm thấy bằng UID."
            );

            console.log(
                "Đang tìm users bằng email:",
                email
            );


            const emailQuery =
                await firestoreDB
                    .collection("users")
                    .where(
                        "email",
                        "==",
                        email
                    )
                    .limit(1)
                    .get();


            console.log(
                "Email query empty:",
                emailQuery.empty
            );


            if (
                !emailQuery.empty
            ) {

                const doc =
                    emailQuery.docs[0];


                const data =
                    doc.data() || {};


                console.log(
                    "Tìm thấy user bằng EMAIL."
                );

                console.log(
                    "Document ID:",
                    doc.id
                );


                return {

                    docId:
                        doc.id,

                    data:
                        data,

                    method:
                        "email"
                };
            }

        } catch (error) {

            console.error(
                "Lỗi query user theo email:",
                error
            );

        }
    }


    /* ==================================================
       KHÔNG TÌM THẤY
    ================================================== */

    console.error(
        "Không tìm thấy user bằng UID hoặc Email.",
        {
            uid:
                uid,

            email:
                email
        }
    );


    return null;
}


/* ======================================================
   SAFE SIGN OUT
====================================================== */

async function safeSignOut() {

    try {

        if (firebaseAuth) {

            await firebaseAuth.signOut();
        }

    } catch (error) {

        console.error(
            "Lỗi signOut:",
            error
        );
    }
}


/* ======================================================
   RESET LOGIN BUTTON
====================================================== */

function resetLoginButton(
    button
) {

    if (!button) {
        return;
    }

    button.disabled =
        false;

    button.textContent =
        "Đăng nhập";
}


/* ======================================================
   TOAST
====================================================== */

function toast(
    message,
    type = "success"
) {

    let el =
        document.getElementById(
            "appToast"
        );


    /* ==========================================
       CREATE
    ========================================== */

    if (!el) {

        el =
            document.createElement(
                "div"
            );

        el.id =
            "appToast";

        document.body.appendChild(
            el
        );


        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            #appToast {

                position: fixed;

                left: 50%;

                bottom: 30px;

                transform:
                    translateX(-50%)
                    translateY(20px);

                display: flex;

                align-items: center;

                gap: 10px;

                max-width: min(
                    90vw,
                    500px
                );

                padding:
                    13px 20px;

                border-radius:
                    12px;

                font-family:
                    'Poppins',
                    sans-serif;

                font-size:
                    14px;

                font-weight:
                    500;

                color:
                    #fff;

                box-shadow:
                    0 10px 30px
                    rgba(0,0,0,.18);

                opacity:
                    0;

                pointer-events:
                    none;

                transition:
                    opacity .25s ease,
                    transform .25s ease;

                z-index:
                    99999;

            }


            #appToast.show {

                opacity:
                    1;

                transform:
                    translateX(-50%)
                    translateY(0);

            }


            #appToast.toast-success {

                background:
                    #1e824c;

            }


            #appToast.toast-error {

                background:
                    #b3261e;

            }


            #appToast.toast-warning {

                background:
                    #b7791f;

            }

        `;


        document.head.appendChild(
            style
        );
    }


    /* ==========================================
       ICON
    ========================================== */

    let icon = "✓";


    if (
        type === "error"
    ) {

        icon = "✕";

    } else if (
        type === "warning"
    ) {

        icon = "!";
    }


    el.innerHTML = `

        <span
            style="
                font-size:16px;
                font-weight:700;
            "
        >
            ${icon}
        </span>

        <span>
            ${escapeHtml(message)}
        </span>

    `;


    el.className =
        `show toast-${type}`;


    clearTimeout(
        window.__toastTimer
    );


    window.__toastTimer =
        setTimeout(
            () => {

                el.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* ======================================================
   ESCAPE HTML
====================================================== */

function escapeHtml(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* ======================================================
   FIREBASE AUTH ERROR
====================================================== */

function getAuthErrorMessage(
    error
) {

    const code =
        error &&
        error.code;


    switch (code) {

        case "auth/invalid-email":

            return (
                "Email không hợp lệ."
            );


        case "auth/user-disabled":

            return (
                "Tài khoản này đã bị vô hiệu hóa."
            );


        case "auth/user-not-found":

            return (
                "Không tìm thấy tài khoản với email này."
            );


        case "auth/wrong-password":

            return (
                "Sai mật khẩu. Vui lòng thử lại."
            );


        case "auth/invalid-credential":

            return (
                "Email hoặc mật khẩu không đúng."
            );


        case "auth/invalid-login-credentials":

            return (
                "Email hoặc mật khẩu không đúng."
            );


        case "auth/too-many-requests":

            return (
                "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau."
            );


        case "auth/network-request-failed":

            return (
                "Lỗi kết nối mạng. Vui lòng kiểm tra internet."
            );


        case "auth/popup-closed-by-user":

            return (
                "Cửa sổ đăng nhập Google đã bị đóng."
            );


        case "auth/popup-blocked":

            return (
                "Trình duyệt đã chặn cửa sổ Google."
            );


        case "auth/cancelled-popup-request":

            return (
                "Yêu cầu đăng nhập Google đã bị hủy."
            );


        case "auth/operation-not-allowed":

            return (
                "Phương thức đăng nhập này chưa được bật trong Firebase."
            );


        case "auth/network-request-failed":

            return (
                "Không thể kết nối Firebase. Hãy kiểm tra mạng."
            );


        default:

            if (
                error &&
                error.message
            ) {

                console.error(
                    "Firebase error message:",
                    error.message
                );
            }


            return (
                "Đã có lỗi xảy ra. Vui lòng thử lại."
            );
    }
}