// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyA3zknvFkQ5Oids3t5DP5RkGPZVpac2TpI",
  authDomain: "lecturaprimaria-4490c.firebaseapp.com",
  projectId: "lecturaprimaria-4490c",
  storageBucket: "lecturaprimaria-4490c.firebasestorage.app",
  messagingSenderId: "516056173373",
  appId: "1:516056173373:web:b33564eab44e4325f41354"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
