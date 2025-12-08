import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvPjYdsbnuNtup1b1gnDDBlhMUJQt47qw",
  authDomain: "testingproject-b4bd5.firebaseapp.com",
  projectId: "testingproject-b4bd5",
  storageBucket: "testingproject-b4bd5.firebasestorage.app",
  messagingSenderId: "588414689097",
  appId: "1:588414689097:web:9bd56f9de5bbe0757dc498",
  measurementId: "G-YNNB1TT15X"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const storage = getStorage(app);

// Add the report function
export async function addReport(statusReport, equipment, issue, pc, room, date, imageFile) {
  try {
    let imageUrl = null;

    // If an image file is provided, upload it to Firebase Storage
    if (imageFile) {
      const storageRef = ref(storage, `report-images/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // Add the report to Firestore
    const docRef = await addDoc(collection(db, "reportList"), {
      equipment,
      issue,
      pc,
      room,
      date,
      imageUrl,
      statusReport,
      timestamp: serverTimestamp()
    });

    return docRef.id;
  } catch (e) {
    console.error("Error adding report:", e);
    throw e;
  }
}

// Add a borrow request to Firestore
export async function addBorrow(
  equipment,
  borrowDate,
  returnDate,
  purpose,
  statusReport,
  productImage,
  fullName,
  userId
) {
  try {
    await addDoc(collection(db, "borrowList"), {
      equipment,
      borrowDate,
      returnDate,
      purpose,
      statusReport,
      downloadURL: productImage || null,
      fullName: fullName || "Unknown",
      userId: userId || null,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Error adding borrow:", e);
    throw e;
  }
}