"use strict";

const firebaseConfig = {
    apiKey: "AIzaSyDiGtSXQMGEE1YWWfW73enu6PK3zjokrw4",
    authDomain: "faq-csk18.firebaseapp.com",
    projectId: "faq-csk18",
    storageBucket: "faq-csk18.firebasestorage.app",
    messagingSenderId: "556457828953",
    appId: "1:556457828953:web:da7973f61f0ac8e5408748",
    measurementId: "G-X0GM41LVMJ"
};

/* =========================================
   INITIALIZE FIREBASE
========================================= */

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

/* =========================================
   FIREBASE SERVICES
========================================= */

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("========================================");
console.log("FIREBASE CONFIG LOADED");
console.log("Project:", firebase.app().options.projectId);
console.log("Auth Domain:", firebase.app().options.authDomain);
console.log("Storage:", firebase.app().options.storageBucket);
console.log("Firebase App:", firebase.app().name);
console.log("========================================");