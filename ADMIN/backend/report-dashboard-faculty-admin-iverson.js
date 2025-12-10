import { printYourrequestInfo } from '../backend/reportForm-admin-iverson.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { db } from "./firebase-config-admin-iverson.js";

export const mainDashboard = document.querySelector('.dashboard');
const storage = getStorage(); // Initialize Firebase Storage



async function displayItems() {
  const querySnapshot = await getDocs(collection(db, "reportItem"));
  const fetchedItems = [];

  querySnapshot.forEach((doc) => {
    fetchedItems.push({ id: doc.id, ...doc.data() });
  });

    // Sort items alphabetically, placing "OTHERS" at the end
  fetchedItems.sort((a, b) => {
    if (a.name === "OTHERS") return 1; // Place "OTHERS" at the end
    if (b.name === "OTHERS") return -1; // Place "OTHERS" at the end
    return a.name.localeCompare(b.name); // Sort alphabetically
  });
  let itemHTML = '';
  fetchedItems.forEach((item) => {
    // Provide a fallback image if item.image is undefined or empty
    const itemImage = item.image || "https://firebasestorage.googleapis.com/v0/b/testingproject-b4bd5.firebasestorage.app/o/icon%2Fprofile-icon.png?alt=media&token=f0f7b9b3-d89d-41ef-b0d5-05fb13e33c79";
    
    itemHTML += `
      <div class="item-container">
        <div class="img-container">
          <img src="${itemImage}" alt="${item.name}">
        </div>
        <p class="item-name">${item.name}</p>
        <button class="rqst-btn" 
                data-item-id="${item.id}" 
                data-name="${item.name}" 
                data-img="${itemImage}">
          EDIT
        </button>
      </div>
    `;
  });

  const addItemHTML = `
   <div class="item-container">
      <div class="img-container">
        <img src="asset/icons/edit-form-icon.png" alt="Add Icon">
      </div>
      <p class="item-name"></p>
      <button class="editform-btn">EDIT FORM</button>
    </div>
    
    <div class="item-container">
      <div class="img-container">
        <img src="asset/icons/add-icon.png" alt="Add Icon">
      </div>
      <p class="item-name"></p>
      <button class="add-btn">ADD ITEM</button>
    </div>
  `;

  itemHTML += addItemHTML;
  document.querySelector('.available-item').innerHTML = itemHTML;

  // Edit Button Handler
  document.querySelectorAll('.rqst-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const itemId = button.getAttribute('data-item-id');
      const name = button.getAttribute('data-name');
      const img = button.getAttribute('data-img');

      document.querySelector('.available-item').classList.add('no-scroll');

      const formHTML = `
        <div class="details-modal-content">
          <div class="details-modal-header">
            <h3 class="details-modal-title">Edit Item</h3>
            <button class="details-modal-close">&times;</button>
          </div>
          <div class="details-modal-body">
            <div class="details-wrapper">
              <div class="details-left">
                <div class="detail-row">
                  <span class="detail-label">Edit Item Name:</span>
                  <span class="detail-value">
                    <input class="item" type="text" placeholder="Item Name" value="${name}">
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Edit Image:</span>
                  <span class="detail-value">
                    <input class="image-file" type="file" accept="image/*">
                  </span>
                </div>
                <!-- Error Message Container (hidden by default) -->
                <div id="error-message" class="error-message">
                  <i class='bx bx-error-circle'></i>
                  <span>Please provide valid name, quantity, and image.</span>
                </div>
                <div class="detail-row">
                  <img src="${img}" alt="Item Image" class="report-image" style="max-width: 100%; height: auto; margin-top: 10px;">
                </div>
                <div class="detail-row">
                  <button class="delete-button" style="margin:3px;">Delete</button>
                  <button class="edit-button" style="margin:3px;">Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      const container = document.createElement('div');
      container.classList.add('details-modal', 'active');
      container.innerHTML = formHTML;
      mainDashboard.appendChild(container);

      const closeModal = () => {
        container.remove();
        document.querySelector('.available-item').classList.remove('no-scroll');
      };

      container.querySelector('.details-modal-close').addEventListener('click', closeModal);
      container.addEventListener('click', (e) => { if (e.target === container) closeModal(); });

      // Image Preview Logic for Replacing Image
      const imageInput = container.querySelector('.image-file');
      const imagePreview = container.querySelector('.report-image');

      imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            imagePreview.src = e.target.result; // Update the image preview
          };
          reader.readAsDataURL(file);
        }
      });

      // Save Edit Logic
      container.querySelector('.edit-button').addEventListener('click', async () => {
        const saveButton = container.querySelector('.edit-button');
        try {
          saveButton.disabled = true;
          saveButton.textContent = "Saving...";

          const editedName = container.querySelector("input.item").value.trim();
          const newImageFile = container.querySelector("input.image-file").files[0];

          if (!editedName) {
            showError();
            saveButton.disabled = false;
            saveButton.textContent = "Save";
            return;
          }

          const itemRef = doc(db, "reportItem", itemId);
          const itemSnap = await getDoc(itemRef);
          if (!itemSnap.exists()) throw new Error("Item not found.");

          let updatedImageUrl = img; // Default to the existing image URL

          // If a new image is selected, upload it to Firebase Storage
          if (newImageFile) {
            const imageRef = ref(storage, `icon/${Date.now()}_${newImageFile.name}`);
            console.log("Uploading new image to Firebase Storage...");
            const snapshot = await uploadBytes(imageRef, newImageFile);
            updatedImageUrl = await getDownloadURL(snapshot.ref);
            console.log("New image uploaded successfully. URL:", updatedImageUrl);
          }

          // Update the item in Firestore
          await updateDoc(itemRef, {
            name: editedName,
            image: updatedImageUrl // Update the image URL
          });

          const reportRef = doc(db, "reportList", itemId);
          const reportSnap = await getDoc(reportRef);
          if (reportSnap.exists()) {
            await updateDoc(reportRef, { statusReport: "Returned" });
          }

          closeModal();
          displayItems();

        } catch (err) {
          console.error("❌ Failed to save item:", err);
          alert("An error occurred while saving the item.");
          saveButton.disabled = false;
          saveButton.textContent = "Save";
        }
      });

      // Delete Item
      container.querySelector('.delete-button').addEventListener('click', async () => {
        const deleteButton = container.querySelector('.delete-button');
        try {
          deleteButton.disabled = true;
          deleteButton.textContent = "Deleting...";

          const itemRef = doc(db, "reportItem", itemId);
          const itemSnap = await getDoc(itemRef);
          if (!itemSnap.exists()) throw new Error("Item not found.");
          await deleteDoc(itemRef);

          const reportRef = doc(db, "reportList", itemId);
          const reportSnap = await getDoc(reportRef);
          if (reportSnap.exists()) {
            await deleteDoc(reportRef);
          }

          closeModal();
          displayItems();

        } catch (err) {
          console.error("❌ Failed to delete item:", err);
          alert("An error occurred while deleting the item.");
          deleteButton.disabled = false;
          deleteButton.textContent = "Delete";
        }
      });
    });
  });
  document.querySelector('.add-btn').addEventListener('click', () => {
    document.querySelector('.available-item').classList.add('no-scroll');
    const formHTML = `
      <div class="details-modal-content">
        <div class="details-modal-header">
          <h3 class="details-modal-title">Add Item</h3>
          <button class="details-modal-close">&times;</button>
        </div>
        <div class="details-modal-body">
          <div class="details-wrapper">
            <div class="details-left">
              <div class="detail-row">
                <span class="detail-label">Item Name:</span>
                <span class="detail-value">
                  <input class="item" type="text" placeholder="Item Name">
                </span>
              </div>
              <!-- Error Message Container (hidden by default) -->
              <div id="error-message" class="error-message">
                <i class='bx bx-error-circle'></i>
                <span>Please provide a valid name and image.</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Image:</span>
                <span class="detail-value">
                  <input class="image-file" type="file" accept="image/*">
                </span>
              </div>
              <div class="detail-row">
                <img class="report-image" src="" alt="Image Preview" style="display: none; max-width: 100%; height: auto; margin-top: 10px;">
              </div>
              <div class="detail-row">
                <button class="edit-button">Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.classList.add('details-modal', 'active');
    container.innerHTML = formHTML;
    mainDashboard.appendChild(container);

    const closeModal = () => {
      container.remove();
    };

    container.querySelector('.details-modal-close').addEventListener('click', closeModal);
    container.addEventListener('click', (e) => { if (e.target === container) closeModal(); });

    // Image Preview Logic
    const imageInput = container.querySelector('.image-file');
    const imagePreview = container.querySelector('.report-image');

    imageInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
      }
    });

    // Add Button Logic
    container.querySelector('.edit-button').addEventListener('click', async () => {
      const addButton = container.querySelector('.edit-button');
      try {
        addButton.disabled = true;
        addButton.textContent = "Adding...";

        const itemName = container.querySelector("input.item").value.trim();
        const imageFile = container.querySelector("input.image-file").files[0];

        // Validation: Check if name or image is missing
        if (!itemName || !imageFile) {
          showError()
          addButton.disabled = false;
          addButton.textContent = "Add";
          return;
        }

        // Upload the image to Firebase Storage
        const imageRef = ref(storage, `icon/${Date.now()}_${imageFile.name}`);
        console.log("Uploading image to Firebase Storage...");
        const snapshot = await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);
        console.log("Image uploaded successfully. URL:", imageUrl);

        // Add the item to Firestore
        const newItemRef = doc(collection(db, "reportItem"));
        await setDoc(newItemRef, {
          name: itemName,
          image: imageUrl,
          createdAt: serverTimestamp()
        });

        closeModal();
        displayItems(); // Refresh the items list

      } catch (err) {
        console.error("❌ Failed to add item:", err);
        alert("An error occurred while adding the item.");
        addButton.disabled = false;
        addButton.textContent = "Add";
      }
    });
  });

  // Load saved form texts
async function loadFormTexts() {
  try {
    const formTextsRef = doc(db, 'formTexts', 'borrowForm');
    const docSnap = await getDoc(formTextsRef);
    return docSnap.exists() ? docSnap.data() : {
      noticeText: "This item/equipment belongs to Gordon College..." // default text
    };
  } catch (error) {
    console.error('Error loading form texts:', error);
    return null;
  }
}

// Edit Form Button Handler
document.querySelector('.editform-btn').addEventListener('click', async () => {
  const formTexts = await loadFormTexts();
  document.querySelector('.available-item').classList.add('no-scroll');
  
  const formHTML = `
    <div class="details-modal-content" style="max-width:720px;width:92%;background:#ffffff;border-radius:12px;padding:16px 16px 14px;box-shadow:0 10px 30px rgba(0,0,0,0.15);">
      <div class="details-modal-header" style="display:flex;align-items:center;justify-content:space-between;">
        <h3 style="margin:0;color:#0f172a;font-size:22px;">Post a Notice</h3>
        <button class="details-modal-close" aria-label="Close" style="background:transparent;border:0;font-size:20px;line-height:1;cursor:pointer;color:#64748b">&times;</button>
      </div>
      <div class="details-modal-sub" style="color:#64748b;font-size:13px;margin:6px 0 12px;">Fill in the details below and choose Save to confirm or Cancel to discard.</div>
      <div class="details-modal-body" style="display:flex;flex-direction:column;gap:10px;">
        <label style="font-weight:600;color:#0f172a;">Important Information:</label>
        <textarea class="notice-text" rows="6" placeholder="Type your Important Information here..." style="padding:10px 12px;border:1px solid #e6e8eb;border-radius:8px;outline:none;">${formTexts.noticeText}</textarea>
        
        <div id="error-message" class="error-message" style="display:none;margin-top:4px;">
          <i class='bx bx-error-circle'></i>
          <span>Please provide a notice text.</span>
        </div>
        
        <div class="button-row" style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
          <button class="save-button" style="display:flex;align-items:center;gap:8px;background:#ff6a00;border:1px solid #ff6a00;color:#fff;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600;">
            <span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#fff;color:#ff6a00;display:flex;align-items:center;justify-content:center;font-size:12px;">✎</span>
            Save
          </button>
          <button class="cancel-button" style="background:#fff;border:1px solid #d0d7de;color:#0f172a;border-radius:8px;padding:8px 12px;cursor:pointer;">Cancel</button>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.classList.add('details-modal', 'active');
  container.innerHTML = formHTML;
  mainDashboard.appendChild(container);

  // Close handlers
  const closeModal = () => {
    container.remove();
    document.querySelector('.available-item').classList.remove('no-scroll');
  };

  container.querySelector('.details-modal-close').addEventListener('click', closeModal);
  container.querySelector('.cancel-button').addEventListener('click', closeModal);
  container.addEventListener('click', e => e.target === container && closeModal());

  // Save handler
  container.querySelector('.save-button').addEventListener('click', async () => {
    const noticeText = container.querySelector('.notice-text').value.trim();
    
    if (!noticeText) {
      const errorEl = container.querySelector('#error-message');
      errorEl.style.display = 'block';
      setTimeout(() => errorEl.style.display = 'none', 3000);
      return;
    }

    try {
      await setDoc(doc(db, 'formTexts', 'borrowForm'), {
        noticeText,
        updatedAt: serverTimestamp()
      });
      closeModal();
    } catch (error) {
      console.error('Error saving form texts:', error);
      alert('Failed to save changes. Please try again.');
    }
  });
});
}

    // Add Button Handler
  
document.addEventListener("DOMContentLoaded", displayItems); // Ensure this is outside the function

function showError() {
  document.querySelector(".error-message").classList.add("show");

  // Automatically hide after 3 seconds
  setTimeout(() => {
    document.querySelector(".error-message").classList.remove("show");
  }, 3000);
}
