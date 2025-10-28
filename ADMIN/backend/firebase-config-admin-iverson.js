import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp,setDoc,doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvPjYdsbnuNtup1b1gnDDBlhMUJQt47qw",
  authDomain: "testingproject-b4bd5.firebaseapp.com",
  projectId: "testingproject-b4bd5",
  storageBucket: "testingproject-b4bd5.firebasestorage.app",
  messagingSenderId: "588414689097",
  appId: "1:588414689097:web:9bd56f9de5bbe0757dc498",
  measurementId: "G-YNNB1TT15X"
};
//
// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app); // ✅ Initialize storage

export { db, storage, app };

// Function to add a report
// Function to add a report and return its ID
export async function addReport( equipment, issue, pc, room, date) {
  try {
    const docRef = await addDoc(collection(db, "reportList"), {
   
      equipment,
      issue,
      pc,
      room,
      date,
      timestamp: serverTimestamp()
    });


    const docId = docRef.id;
    console.log("Report added successfully with ID: Admin", docId);

    return docId; // You can use this ID to set as a data-set attribute
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}
export async function addBorrow( equipment,borrowDate, returnDate, purpose) {
  try {
    const docRef = await addDoc(collection(db, "borrowList"), {
   
      equipment,
      borrowDate,
      returnDate,
       purpose,
      timestamp: serverTimestamp()
    });


    const docId = docRef.id;
    console.log("Report added successfully with ID:", docId);

    return docId; // You can use this ID to set as a data-set attribute
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}



export async function addRoom(roomNumber) {
  try {
    const docRef = await addDoc(collection(db, "rooms"), {
   
     roomNumber,
      timestamp: serverTimestamp()
    });

    const docId = docRef.id;
    console.log("Report added successfully with ID:", docId);

    return docId; // You can use this ID to set as a data-set attribute
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}


// add pc to room 

/*

async function fillComlabRooms(start, end) {
  try {
    const batch = writeBatch(db); // ✅ Correct way to create a batch
    for (let room = start; room <= end; room++) {
      const docRef = doc(db, 'comlabrooms', room.toString());
      batch.set(docRef, { roomNumber: room });
    }
    await batch.commit(); // ✅ Commit the batch
    console.log(`Added rooms from ${start} to ${end}`);
  } catch (error) {
    console.error("Error adding rooms: ", error);
  }
}

// Call the function
fillComlabRooms(517, 525).catch(console.error);

// function that add a subcollection to each room


import { getDocs,   writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Adds 30 PC sub-collections to a given room in batches for better performance.

async function addPCSubCollections(roomId) {
  try {
    const batch = writeBatch(db);

    for (let pcNumber = 1; pcNumber <= 30; pcNumber++) {
      const subCollectionName = `pc${pcNumber}`;
      const pcSubCollectionRef = doc(db, "comlabrooms", roomId, subCollectionName, "document1");

      batch.set(pcSubCollectionRef, {
        repairHistory: serverTimestamp(),
        status: "available"
      });
    }

    await batch.commit();
    console.log(`✅ Successfully added 30 PC sub-collections to room ${roomId}`);
  } catch (error) {
    console.error(`❌ Failed to add PCs to room ${roomId}:`, error);
  }
}

// Loops through all rooms in "comlabrooms" and adds PCs to each one.

async function addPCsToAllRooms() {
  try {
    const roomsSnapshot = await getDocs(collection(db, "comlabrooms"));
    const addPCsPromises = roomsSnapshot.docs.map((roomDoc) =>
      addPCSubCollections(roomDoc.id)
    );

    await Promise.all(addPCsPromises);
    console.log("✅ All rooms have been updated with 30 PC sub-collections each.");
  } catch (error) {
    console.error("❌ Failed to add PCs to all rooms:", error);
  }
}

// Call the function
addPCsToAllRooms();
*/