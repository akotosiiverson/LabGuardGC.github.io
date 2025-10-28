import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvPjYdsbnuNtup1b1gnDDBlhMUJQt47qw",
  authDomain: "testingproject-b4bd5.firebaseapp.com",
  projectId: "testingproject-b4bd5",
  storageBucket: "testingproject-b4bd5.firebasestorage.app",
  messagingSenderId: "588414689097",
  appId: "1:588414689097:web:9bd56f9de5bbe0757dc498",
  measurementId: "G-YNNB1TT15X"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {
  const googleLogin = document.getElementById("google-login-btn");

  if (googleLogin) {
    googleLogin.addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const idTokenResult = await user.getIdTokenResult();

        if (idTokenResult.claims.admin) {
          window.location.href = "ADMIN/structure-admin-iverson.html";
        } else {
          window.location.href = "structure.html";
        }
      } catch (error) {
        console.error("Google login failed:", error);
      }
    });
  }
});
