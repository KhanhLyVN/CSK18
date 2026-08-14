const firebaseConfig = {
  apiKey: "AIzaSyDiGtSXQMGEE1YWWfW73enu6PK3zjokr4",
  authDomain: "faq-csk18.firebaseapp.com",
  projectId: "faq-csk18",
  storageBucket: "faq-csk18.firebasestorage.app",
  messagingSenderId: "556457828953",
  appId: "1:556457828953:web:da7973f61f0ac8e5408748",
  measurementId: "G-X0GM41LVMJ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

window.auth = auth;
window.db = db;
window.storage = storage;

// Phân quyền đơn giản, dùng chính users/{uid}.role của Firebase cũ.
window.CSK18_ROLES = Object.freeze({
  STUDENT: "student",
  CS: "cs",
  ADMIN: "admin"
});

window.CSK18 = {
  getRole: async function (user) {
    if (!user) return "";
    if (user.email && user.email.toLowerCase() === "admin@gmail.com") return "admin";
    try {
      const snap = await db.collection("users").doc(user.uid).get();
      return snap.exists ? String(snap.data().role || "").toLowerCase() : "";
    } catch (error) {
      console.error("Không thể đọc quyền người dùng:", error);
      return "";
    }
  },
  signOut: function () {
    return auth.signOut();
  }
};
