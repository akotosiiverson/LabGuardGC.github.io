import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { db } from "./firebase-config-admin-iverson.js";

export const mainDashboard = document.querySelector('.dashboard');
const storage = getStorage(); // Initialize Firebase Storage



async function displayItems() {
  const querySnapshot = await getDocs(collection(db, "borrowItem"));
  const fetchedItems = [];

  querySnapshot.forEach((doc) => {
    fetchedItems.push({ id: doc.id, ...doc.data() });
  });

  let itemHTML = '';
  fetchedItems.forEach((item) => {
    // Provide a fallback image if item.image is undefined or empty
    const itemImage = item.image || "https://firebasestorage.googleapis.com/v0/b/testingproject-b4bd5.firebasestorage.app/o/icon%2Fprofile-icon.png?alt=media&token=f0f7b9b3-d89d-41ef-b0d5-05fb13e33c79";
    
    itemHTML += `
      <div class="item-container">
        <div class="img-container">
          <div class="quantity-div">
            <p class="quantity">${item.quantity}</p>
          </div>
          <img src="${itemImage}" alt="${item.name}">
        </div>
        <p class="item-name">${item.name}</p>
        <button class="rqst-btn" 
                data-item-id="${item.id}" 
                data-name="${item.name}" 
                data-quantity="${item.quantity}" 
                data-img="${itemImage}">
          EDIT
        </button>
      </div>
    `;
  });

  const addItemHTML = `
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
      const quantity = button.getAttribute('data-quantity');
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
                  <span class="detail-label">Edit Quantity:</span>
                  <span class="detail-value">
                    <input class="quantity" type="number" min="0" placeholder="0" value="${quantity}">
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
                  <button class="delete-button">Delete</button>
                  <button class="edit-button">Save</button>
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
          const editedQuantity = parseInt(container.querySelector("input.quantity").value.trim(), 10);
          const newImageFile = container.querySelector("input.image-file").files[0];

          if (!editedName || isNaN(editedQuantity)) {
            showError();
            saveButton.disabled = false;
            saveButton.textContent = "Save";
            return;
          }

          const itemRef = doc(db, "borrowItem", itemId);
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
            quantity: editedQuantity,
            image: updatedImageUrl // Update the image URL
          });

          const reportRef = doc(db, "borrowList", itemId);
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

          const itemRef = doc(db, "borrowItem", itemId);
          const itemSnap = await getDoc(itemRef);
          if (!itemSnap.exists()) throw new Error("Item not found.");
          await deleteDoc(itemRef);

          const reportRef = doc(db, "borrowList", itemId);
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

  // Add Button Handler
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
              <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">
                  <input class="quantity" type="number" min="0" placeholder="0">
                </span>
              </div>
              
                <!-- Error Message Container (hidden by default) -->
                    <div id="error-message" class="error-message">
                        <i class='bx bx-error-circle'></i>
                        <span>Please provide valid name, quantity, and image.</span>
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
      document.querySelector('.available-item').classList.remove('no-scroll');
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
        const itemQuantity = parseInt(container.querySelector("input.quantity").value.trim(), 10);
        const imageFile = container.querySelector("input.image-file").files[0];

        if (!itemName || isNaN(itemQuantity) || !imageFile) {
          
          showError()
          addButton.textContent = "Add"
          return;
        }

        try {
          const imageRef = ref(storage, `icon/${Date.now()}_${imageFile.name}`);
          console.log("Uploading image to Firebase Storage...");
          const snapshot = await uploadBytes(imageRef, imageFile);
          const imageUrl = await getDownloadURL(snapshot.ref);
          console.log("Image uploaded successfully. URL:", imageUrl);

          const newItemRef = doc(collection(db, "borrowItem"));
          await setDoc(newItemRef, {
            name: itemName,
            quantity: itemQuantity,
            image: imageUrl
          });

          closeModal();
          displayItems();

        } catch (error) {
          console.error("Error uploading image:", error);
          alert("An error occurred while uploading the image.");
          addButton.disabled = false;
          addButton.textContent = "Add";
        }

      } catch (err) {
        console.error("❌ Failed to add item:", err);
        alert("An error occurred while adding the item.");
        addButton.disabled = false;
        addButton.textContent = "Add";
      }
    });
  });

  
}

document.addEventListener("DOMContentLoaded", displayItems);


// error for edit item and add item if there is no item name or quantity input 
function showError() {
        document.querySelector(".error-message").classList.add("show");

        // Automatically hide after 3 seconds
        setTimeout(() => {
          document.querySelector(".error-message").classList.remove("show");
        }, 3000);
      }
