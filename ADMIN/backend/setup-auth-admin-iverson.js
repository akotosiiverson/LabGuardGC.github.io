// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvPjYdsbnuNtup1b1gnDDBlhMUJQt47qw",
  authDomain: "testingproject-b4bd5.firebaseapp.com",
  projectId: "testingproject-b4bd5",
  storageBucket: "testingproject-b4bd5.firebasestorage.app",
  messagingSenderId: "588414689097",
  appId: "1:588414689097:web:9bd56f9de5bbe0757dc498",
  measurementId: "G-YNNB1TT15X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create a new user in auth collection
async function createAuthUser() {
  try {
    // Default admin user
    const adminUser = {
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
      displayName: "Administrator"
    };
    
    // Create the document in auth collection (with auto-generated ID)
    const docRef = await addDoc(collection(db, "auth"), adminUser);
    console.log("Auth user created successfully with ID:", docRef.id);
    document.getElementById("statusMessage").textContent = 
      "New auth user created successfully! You can now log in with email: admin@example.com and password: admin123";
  } catch (error) {
    console.error("Error creating auth user:", error);
    document.getElementById("statusMessage").textContent = "Error: " + error.message;
  }
}

// Setup page
document.addEventListener('DOMContentLoaded', () => {
  const createButton = document.getElementById('createButton');
  createButton.addEventListener('click', createAuthUser);
  
  document.getElementById("statusMessage").textContent = 
    "NOTE: The system has been updated to work with your existing auth collection. This page can be used to add additional users if needed.";
});
