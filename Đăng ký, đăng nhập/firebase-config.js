const firebaseConfig = {
  apiKey: "AIzaSyDbdQ_ve1jWzySmyJhTc4iNtr60YJGNiQw",
  authDomain: "support-center-f604e.firebaseapp.com",
  projectId: "support-center-f604e",
  storageBucket: "support-center-f604e.firebasestorage.app",
  messagingSenderId: "122692910115",
  appId: "1:122692910115:web:27d9cd2a77f5f4eb438596",
  measurementId: "G-LQGRCCD419"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();