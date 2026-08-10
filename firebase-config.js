const firebaseConfig = {
  apiKey: "AIzaSyDiGtSXQMGEE1YWWfW73enu6PK3zjokrw4",
  authDomain: "faq-csk18.firebaseapp.com",
  projectId: "faq-csk18",
  storageBucket: "faq-csk18.firebasestorage.app",
  messagingSenderId: "556457828953",
  appId: "1:556457828953:web:da7973f61f0ac8e5408748",
  measurementId: "G-X0GM41LVMJ"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();