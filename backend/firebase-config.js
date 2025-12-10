import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
// Initialize Cloud Storage and Firestore
export const storage = getStorage(app);
export const db = getFirestore(app);

// Add the report function
export async function addReport(equipment, issue, pc, room, statusReport, imageFile, submitterName, submitterId) {
  try {
    let imageUrl = null;

    // Only attempt upload when a real File was provided
    if (imageFile instanceof File) {
      const rawName = (imageFile.name || 'report-image').toString();
      const safeName = rawName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `report-images/${Date.now()}_${safeName}`;

      const storageRef = ref(storage, path);
      const metadata = { contentType: imageFile.type || 'application/octet-stream' };

      const snapshot = await uploadBytes(storageRef, imageFile, metadata);
      imageUrl = await getDownloadURL(snapshot.ref);
    } else {
      // no file provided — proceed without image upload
      console.debug('addReport: no image file provided, skipping upload');
    }

    // Add the report to Firestore
    const docRef = await addDoc(collection(db, "reportList"), {
      equipment,
      issue,
      pc,
      room,
      date: new Date().toISOString(),
      imageUrl,
      statusReport,
      submitterName: submitterName || null,
      submitterId: submitterId || null,
      timestamp: serverTimestamp()
    });

    return docRef.id;
  } catch (err) {
    console.error("Error adding report: ", err);
    throw err;
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
