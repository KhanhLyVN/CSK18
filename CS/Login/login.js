"use strict";

/* =========================================================
   SUPPORT CENTER - LOGIN
   FIREBASE
   Project: faq-csk18

   QUAN TRỌNG:
   - KHÔNG khai báo const db
   - KHÔNG khai báo const auth
   - KHÔNG khai báo const storage
   - Firebase được lấy từ firebase-config.js
========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

function getAuth() {
    try {
        if (
            typeof firebase === "undefined" ||
            !firebase.apps ||
            !firebase.apps.length
        ) {
            console.error("Firebase chưa được initialize.");
            return null;
        }

        return firebase.auth();

    } catch (error) {
        console.error(
            "Không thể lấy Firebase Auth:",
            error
        );

        return null;
    }
}


function getDB() {
    try {
        if (
            typeof firebase === "undefined" ||
            !firebase.apps ||
            !firebase.apps.length
        ) {
            console.error("Firebase chưa được initialize.");
            return null;
        }

        return firebase.firestore();

    } catch (error) {
        console.error(
            "Không thể lấy Firestore:",
            error
        );

        return null;
    }
}


/* =========================================================
   FIREBASE DEBUG
========================================================= */

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

        const app = firebase.app();

        console.log(
            "========================================"
        );

        console.log(
            "Firebase đã sẵn sàng"
        );

        console.log(
            "Project:",
            app.options.projectId
        );

        console.log(
            "Auth Domain:",
            app.options.authDomain
        );

        console.log(
            "Storage:",
            app.options.storageBucket
        );

        console.log(
            "========================================"
        );

    } catch (error) {

        console.error(
            "Firebase debug error:",
            error
        );
    }
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        debugFirebase();

        setupPasswordToggle();

        setupGoogleLogin();

        setupEmailPasswordLogin();

    }
);

/* =========================================================
   RESET LOGIN PAGE
   Khi quay lại trang login sau Logout / Back / BFCache
========================================================= */

function resetLoginPageState() {

    const loginButton = document.querySelector(
        '#loginForm .btn'
    );

    const googleButton = document.getElementById(
        'googleLogin'
    );

    if (loginButton) {
        loginButton.disabled = false;
        loginButton.innerHTML = `

            Đăng nhập
        `;
    }

    if (googleButton) {
        googleButton.disabled = false;
        googleButton.innerHTML = `

            Đăng nhập bằng Google
        `;
    }
}


/* =========================================================
   PAGE SHOW
   Quan trọng khi trình duyệt dùng BFCache
========================================================= */

window.addEventListener(
    "pageshow",
    function () {

        resetLoginPageState();

    }
);

/* =========================================================
   PASSWORD TOGGLE
========================================================= */

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
        function () {

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


/* =========================================================
   GOOGLE LOGIN
========================================================= */

function setupGoogleLogin() {

    const googleButton =
        document.getElementById(
            "googleLogin"
        );

    if (!googleButton) {
        return;
    }


    googleButton.addEventListener(
        "click",
        async function () {

            const auth = getAuth();

            const db = getDB();

            if (!auth) {

                toast(
                    "Firebase Authentication chưa sẵn sàng.",
                    "error"
                );

                return;
            }

            if (!db) {

                toast(
                    "Firestore chưa sẵn sàng.",
                    "error"
                );

                return;
            }


            const oldHTML =
                googleButton.innerHTML;


            googleButton.disabled =
                true;

            googleButton.innerHTML =
                `
                Đang đăng nhập...
                `;


            try {

                /* =========================================
                   GOOGLE PROVIDER
                ========================================= */

                const provider =
                    new firebase.auth.GoogleAuthProvider();


                provider.setCustomParameters({
                    prompt: "select_account"
                });


                /* =========================================
                   GOOGLE POPUP
                ========================================= */

                const result =
                    await auth.signInWithPopup(
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
                    "Google Auth thành công."
                );

                console.log(
                    "UID:",
                    user.uid
                );

                console.log(
                    "Email:",
                    user.email
                );


                /* =========================================
                   FIRESTORE PROFILE
                ========================================= */

                const account =
                    await findUserProfile(
                        user
                    );


                if (!account) {

                    await safeSignOut();

                    toast(
                        "Tài khoản Google chưa được cấp quyền trong hệ thống.",
                        "error"
                    );

                    resetGoogleButton(
                        googleButton,
                        oldHTML
                    );

                    return;
                }


                const userData =
                    account.data || {};


                console.log(
                    "Firestore user:",
                    userData
                );


                /* =========================================
                   STATUS
                ========================================= */

                if (
                    userData.status &&
                    userData.status !== "active"
                ) {

                    await safeSignOut();

                    toast(
                        "Tài khoản hiện không hoạt động.",
                        "error"
                    );

                    resetGoogleButton(
                        googleButton,
                        oldHTML
                    );

                    return;
                }


                /* =========================================
                   KIỂM TRA QUYỀN
                ========================================= */

                const accountType =
                    getAccountType(
                        userData
                    );


                console.log(
                    "Account Type:",
                    accountType
                );

                console.log(
                    "Role:",
                    userData.role
                );


                /* =========================================
                   ĐIỀU HƯỚNG
                ========================================= */

                const redirect =
                    getRedirectPage(
                        userData
                    );


                if (!redirect) {

                    console.error(
                        "Không xác định được quyền:",
                        userData
                    );

                    await safeSignOut();

                    toast(
                        "Tài khoản chưa được phân quyền trong hệ thống.",
                        "error"
                    );

                    resetGoogleButton(
                        googleButton,
                        oldHTML
                    );

                    return;
                }


                toast(
                    getSuccessMessage(
                        userData
                    ),
                    "success"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            redirect;

                    },
                    500
                );

            } catch (error) {

                console.error(
                    "Lỗi Google Login:",
                    error
                );

                toast(
                    getAuthErrorMessage(
                        error
                    ),
                    "error"
                );

                resetGoogleButton(
                    googleButton,
                    oldHTML
                );
            }

        }
    );
}


/* =========================================================
   EMAIL / PASSWORD LOGIN
========================================================= */

function setupEmailPasswordLogin() {

    const form =
        document.getElementById(
            "loginForm"
        );

    if (!form) {
        return;
    }


    const emailInput =
        document.getElementById(
            "loginEmail"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    const loginButton =
        form.querySelector(
            ".btn"
        );


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =========================================
               INPUT
            ========================================= */

            if (
                !emailInput ||
                !passwordInput
            ) {

                toast(
                    "Không tìm thấy thông tin đăng nhập.",
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


            /* =========================================
               VALIDATE
            ========================================= */

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


            /* =========================================
               FIREBASE
            ========================================= */

            const auth = getAuth();

            const db = getDB();


            if (!auth) {

                toast(
                    "Firebase Authentication chưa sẵn sàng.",
                    "error"
                );

                return;
            }


            if (!db) {

                toast(
                    "Firestore chưa sẵn sàng.",
                    "error"
                );

                return;
            }


            /* =========================================
               BUTTON LOADING
            ========================================= */

            const oldText =
                loginButton
                    ? loginButton.innerHTML
                    : "";


            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.innerHTML =
                    `
                    Đang đăng nhập...
                    `;
            }


            try {

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
                    "========================================"
                );


                /* =========================================
                   1. FIREBASE AUTH
                ========================================= */

                const result =
                    await auth.signInWithEmailAndPassword(
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
                    "UID:",
                    user.uid
                );

                console.log(
                    "Auth Email:",
                    user.email
                );


                /* =========================================
                   2. FIRESTORE PROFILE
                ========================================= */

                const account =
                    await findUserProfile(
                        user
                    );


                /* =========================================
                   3. KHÔNG CÓ PROFILE
                ========================================= */

                if (!account) {

                    await safeSignOut();

                    toast(
                        "Tài khoản Firebase chưa được cấp quyền trong hệ thống.",
                        "error"
                    );

                    resetLoginButton(
                        loginButton,
                        oldText
                    );

                    return;
                }


                const userData =
                    account.data || {};


                console.log(
                    "========================================"
                );

                console.log(
                    "FIRESTORE USER"
                );

                console.log(
                    "Document:",
                    account.docId
                );

                console.log(
                    "Data:",
                    userData
                );

                console.log(
                    "========================================"
                );


                /* =========================================
                   4. KIỂM TRA EMAIL
                ========================================= */

                const authEmail =
                    String(
                        user.email || ""
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
                    authEmail &&
                    firestoreEmail !== authEmail
                ) {

                    console.error(
                        "Email không khớp:",
                        {
                            authEmail,
                            firestoreEmail
                        }
                    );

                    await safeSignOut();

                    toast(
                        "Email Firebase và hồ sơ tài khoản không khớp.",
                        "error"
                    );

                    resetLoginButton(
                        loginButton,
                        oldText
                    );

                    return;
                }


                /* =========================================
                   5. STATUS
                ========================================= */

                if (
                    userData.status &&
                    userData.status !== "active"
                ) {

                    await safeSignOut();

                    toast(
                        "Tài khoản hiện không hoạt động.",
                        "error"
                    );

                    resetLoginButton(
                        loginButton,
                        oldText
                    );

                    return;
                }


                /* =========================================
                   6. LẤY ACCOUNT TYPE
                ========================================= */

                const accountType =
                    getAccountType(
                        userData
                    );


                console.log(
                    "Account Type:",
                    accountType
                );

                console.log(
                    "Role:",
                    userData.role
                );


                /* =========================================
                   7. XÁC ĐỊNH TRANG
                ========================================= */

                const redirect =
                    getRedirectPage(
                        userData
                    );


                /* =========================================
                   8. KHÔNG CÓ QUYỀN
                ========================================= */

                if (!redirect) {

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
                        loginButton,
                        oldText
                    );

                    return;
                }


                /* =========================================
                   9. LOGIN SUCCESS
                ========================================= */

                toast(
                    getSuccessMessage(
                        userData
                    ),
                    "success"
                );


                /* =========================================
                LOGIN SUCCESS
                ========================================= */

                toast(
                    getSuccessMessage(userData),
                    "success"
                );

                /*
                * Không đổi nút thành "Đăng nhập thành công".
                * Nút luôn giữ đúng trạng thái "Đăng nhập".
                */

                resetLoginButton(
                    loginButton,
                    null
                );

                setTimeout(
                    function () {

                        window.location.replace(
                            redirect
                        );

                    },
                    500
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
                    loginButton,
                    oldText
                );
            }

        }
    );
}


/* =========================================================
   GET ACCOUNT TYPE
=========================================================

   Firebase của bé hiện tại có:

   role: "student"

   nhưng KHÔNG có:

   accountType

   Vì vậy phải hỗ trợ cả hai.

========================================================= */

function getAccountType(data) {

    if (!data) {
        return "";
    }


    /* =========================================
       ƯU TIÊN accountType
    ========================================= */

    if (data.accountType) {

        return String(
            data.accountType
        )
            .trim()
            .toLowerCase();
    }


    /* =========================================
       FALLBACK ROLE
    ========================================= */

    if (data.role) {

        const role =
            String(
                data.role
            )
                .trim()
                .toLowerCase();


        /* STUDENT */

        if (
            role === "student" ||
            role === "hocvien" ||
            role === "học viên"
        ) {

            return "student";
        }


        /* ADMIN */

        if (
            role === "admin" ||
            role === "administrator"
        ) {

            return "admin";
        }


        /* CUSTOMER SUCCESS */

        if (
            role === "customer_success" ||
            role === "customer-success" ||
            role === "cs"
        ) {

            return "customer_success";
        }


        /* MANAGER */

        if (
            role === "manager" ||
            role === "cs_manager"
        ) {

            return "customer_success";
        }
    }


    return "";
}


/* =========================================================
   GET REDIRECT PAGE
========================================================= */

function getRedirectPage(data) {

    if (!data) {
        return null;
    }


    const accountType =
        getAccountType(data);


    /* =========================================
       ADMIN
    ========================================= */

    if (
        accountType === "admin"
    ) {

        return "/ADMIN/homepage-ad.html";
    }


    /* =========================================
       CUSTOMER SUCCESS
    ========================================= */

    if (
        accountType ===
        "customer_success"
    ) {

        return "/CS/homepageCS/trangchu-cs.html";
    }


    /* =========================================
       STUDENT
    ========================================= */

    if (
        accountType === "student"
    ) {

        return "/HV/homepage-hv/homepage.html";
    }


    return null;
}


/* =========================================================
   SUCCESS MESSAGE
========================================================= */

function getSuccessMessage(data) {

    const accountType =
        getAccountType(data);


    if (
        accountType === "admin"
    ) {

        return "Đăng nhập Admin thành công!";
    }


    if (
        accountType === "customer_success"
    ) {

        return "Đăng nhập CS thành công!";
    }


    if (
        accountType === "student"
    ) {

        return "Đăng nhập học viên thành công!";
    }


}


/* =========================================================
   FIND USER PROFILE
=========================================================

   Ưu tiên:

   1. users/{Firebase UID}

   2. users where email == Firebase email

========================================================= */

async function findUserProfile(user) {

    if (!user) {
        return null;
    }


    const db = getDB();


    if (!db) {

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


    /* =========================================
       CÁCH 1 - UID
    ========================================= */

    if (uid) {

        try {

            const snapshot =
                await db
                    .collection("users")
                    .doc(uid)
                    .get();


            console.log(
                "Kiểm tra users/" + uid
            );

            console.log(
                "Exists:",
                snapshot.exists
            );


            if (snapshot.exists) {

                return {

                    docId:
                        snapshot.id,

                    data:
                        snapshot.data() || {},

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


    /* =========================================
       CÁCH 2 - EMAIL
    ========================================= */

    if (email) {

        try {

            console.log(
                "Không tìm thấy bằng UID."
            );

            console.log(
                "Tìm bằng email:",
                email
            );


            const result =
                await db
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
                result.empty
            );


            if (!result.empty) {

                const document =
                    result.docs[0];


                return {

                    docId:
                        document.id,

                    data:
                        document.data() || {},

                    method:
                        "email"
                };
            }

        } catch (error) {

            console.error(
                "Lỗi query users theo email:",
                error
            );
        }
    }


    console.error(
        "Không tìm thấy user.",
        {
            uid,
            email
        }
    );


    return null;
}


/* =========================================================
   SAFE SIGN OUT
========================================================= */

async function safeSignOut() {

    try {

        const auth = getAuth();


        if (auth) {

            await auth.signOut();
        }

    } catch (error) {

        console.error(
            "Lỗi signOut:",
            error
        );
    }
}


/* =========================================================
   RESET LOGIN BUTTON
========================================================= */

function resetLoginButton(button) {

    if (!button) {
        return;
    }

    button.disabled = false;

    button.innerHTML = `

        Đăng nhập
    `;
}

/* =========================================================
   RESET GOOGLE BUTTON
========================================================= */

function resetGoogleButton(button) {

    if (!button) {
        return;
    }

    button.disabled = false;

    button.innerHTML = `
        <span class="material-symbols-rounded">
            login
        </span>
        Đăng nhập bằng Google
    `;
}

/* =========================================================
   TOAST
========================================================= */

function toast(
    message,
    type = "success"
) {

    let element =
        document.getElementById(
            "appToast"
        );


    /* =========================================
       CREATE ELEMENT
    ========================================= */

    if (!element) {

        element =
            document.createElement(
                "div"
            );


        element.id =
            "appToast";


        document.body.appendChild(
            element
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

                max-width:
                    min(90vw, 500px);

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
                    999999;

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


            #appToast .material-symbols-rounded {

                font-size:
                    20px;

            }

        `;


        document.head.appendChild(
            style
        );
    }


    /* =========================================
       ICON
    ========================================= */

    let icon =
        " ";


    if (
        type === "error"
    ) {

        icon =
            "error";

    } else if (
        type === "warning"
    ) {

        icon =
            "warning";
    }


    element.innerHTML = `

        <span class="material-symbols-rounded">
            ${icon}
        </span>

        <span>
            ${escapeHtml(message)}
        </span>

    `;


    element.className =
        `show toast-${type}`;


    clearTimeout(
        window.__supportToastTimer
    );


    window.__supportToastTimer =
        setTimeout(
            function () {

                element.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

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


/* =========================================================
   FIREBASE AUTH ERROR
========================================================= */

function getAuthErrorMessage(
    error
) {

    const code =
        error &&
        error.code;


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


        case "auth/invalid-login-credentials":

            return "Email hoặc mật khẩu không đúng.";


        case "auth/too-many-requests":

            return "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.";


        case "auth/network-request-failed":

            return "Không thể kết nối Firebase. Hãy kiểm tra mạng.";


        case "auth/popup-closed-by-user":

            return "Cửa sổ đăng nhập Google đã bị đóng.";


        case "auth/popup-blocked":

            return "Trình duyệt đã chặn cửa sổ Google.";


        case "auth/cancelled-popup-request":

            return "Yêu cầu đăng nhập Google đã bị hủy.";


        case "auth/operation-not-allowed":

            return "Phương thức đăng nhập này chưa được bật trong Firebase.";


        case "auth/account-exists-with-different-credential":

            return "Email này đã tồn tại bằng phương thức đăng nhập khác.";


        case "auth/unauthorized-domain":

            return "Tên miền hiện tại chưa được cấp quyền trong Firebase Authentication.";


        default:

            console.error(
                "Firebase Error:",
                error
            );


            if (
                error &&
                error.message
            ) {

                console.error(
                    error.message
                );
            }


            return "Đã có lỗi xảy ra. Vui lòng thử lại.";
    }
}