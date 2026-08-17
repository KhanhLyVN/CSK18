"use strict";

const firebaseConfig = {
    apiKey: "AIzaSyDiGtSXQMGEE1YWWfW73enu6PK3zjokr4",
    authDomain: "faq-csk18.firebaseapp.com",
    projectId: "faq-csk18",
    storageBucket: "faq-csk18.firebasestorage.app",
    messagingSenderId: "556457828953",
    appId: "1:556457828953:web:da7973f61f0ac8e5408748",
    measurementId: "G-X0GM41LVMJ"
};

/* Chỉ initialize nếu chưa có Firebase App */
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

/* Firebase services */
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();