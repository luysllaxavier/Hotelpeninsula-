// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIpqQdPOPJwFJZ8xsJjee6NglJJ_xxJzM",
  authDomain: "hotel-peninsula-117e0.firebaseapp.com",
  projectId: "hotel-peninsula-117e0",
  storageBucket: "hotel-peninsula-117e0.firebasestorage.app",
  messagingSenderId: "368619058903",
  appId: "1:368619058903:web:9d952ac760e7fa27722292",
  measurementId: "G-V357FB44N9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
