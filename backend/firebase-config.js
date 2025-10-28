import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvPjYdsbnuNtup1b1gnDDBlhMUJQt47qw",
  authDomain: "testingproject-b4bd5.firebaseapp.com",
  projectId: "testingproject-b4bd5",
  storageBucket: "testingproject-b4bd5.firebasestorage.app",
  messagingSenderId: "588414689097",
  appId: "1:588414689097:web:9bd56f9de5bbe0757dc498",
  measurementId: "G-YNNB1TT15X"
};
// ✅ Prevent duplicate initialization
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, app };

// ✅ Add Report Function
export async function addReport(equipment, issue, pc, room, statusReport, imageFile,fullName,userId) {
  try {
    let imageUrl = null;

    // ✅ Upload image if provided
    if (imageFile) {
      const imageRef = ref(storage, `reportImage/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // ✅ Save to Firestore
    const docRef = await addDoc(collection(db, "reportList"), {
      equipment,
      issue,
      pc,
      room,
      statusReport,
      imageUrl: imageUrl || null,
      date: serverTimestamp(),
      fullName,
      userId
    });

    console.log("Report added successfully with ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding report: ", e);
  }
}

// ✅ Add Borrow Request Function
export async function addBorrow(equipment, borrowDate, returnDate, purpose, statusReport, downloadURL,fullName, userId) {
  try {
    const docRef = await addDoc(collection(db, "borrowList"), {
      equipment,
      borrowDate,
      returnDate,
      purpose,
      statusReport,
      downloadURL,
      timestamp: serverTimestamp(),
      fullName, userId
    });

    console.log("Borrow request added successfully with ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding borrow request: ", e);
  }
}
