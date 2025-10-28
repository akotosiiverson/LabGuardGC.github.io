import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvPjYdsbnuNtup1b1gnDDBlhMUJQt47qw",
  authDomain: "testingproject-b4bd5.firebaseapp.com",
  projectId: "testingproject-b4bd5",
  storageBucket: "testingproject-b4bd5.firebasestorage.app",
  messagingSenderId: "588414689097",
  appId: "1:588414689097:web:9bd56f9de5bbe0757dc498",
  measurementId: "G-YNNB1TT15X"
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Please log in with Google.");
      window.location.href = "/index.html"; // ✅ fixed .htm to .html
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const fullNameFromDB = userDocSnap.exists() ? userDocSnap.data().fullName : null;

      const displayName = fullNameFromDB || user.displayName || "No Name";
      const email = user.email || "No Email";
      const photoURL = user.photoURL || "https://firebasestorage.googleapis.com/v0/b/testingproject-b4bd5.firebasestorage.app/o/icon%2Fprofile-icon.png?alt=media&token=f0f7b9b3-d89d-41ef-b0d5-05fb13e33c79";

      // Check if elements exist before setting their properties
      const userNameElement = document.getElementById("userName");
      const userEmailElement = document.getElementById("userEmail");
      const userProfilePictureElement = document.getElementById("userProfilePicture");

      if (userNameElement) {
        userNameElement.textContent = displayName;
      }
      if (userEmailElement) {
        userEmailElement.textContent = email;
      }
      if (userProfilePictureElement) {
        userProfilePictureElement.src = photoURL;
        userProfilePictureElement.alt = displayName;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  });
});
