import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { printYourrequestInfo } from '../backend/borrowForm.js';

export const mainDashboard = document.querySelector('.dashboard');

const itemMap = {}; // Store items for quick lookup

// Check quantity and return button label
function availabilityOfQuantityOfItem(item) {
  return item.quantity <= 0 ? 'NOT AVAILABLE' : 'BORROW';
}

function updateRequestButtonStates() {
  document.querySelectorAll('.rqst-btn').forEach(btn => {
    const itemId = btn.dataset.itemId;
    const item = itemMap[itemId];
    if (item.quantity <= 0) {
      btn.disabled = true;
      btn.textContent = 'NOT AVAILABLE';
    } else {
      btn.disabled = false;
      btn.textContent = 'BORROW';
    }
  });
}

async function displayItems() {
  const querySnapshot = await getDocs(collection(db, "borrowItem"));
  const items = [];

  querySnapshot.forEach((doc) => {
    const item = { id: doc.id, ...doc.data() };
    items.push(item);
    itemMap[item.id] = item;
  });

  let itemHTML = '';
  items.forEach((item) => {
    const availabilityText = availabilityOfQuantityOfItem(item);
    const isAvailable = item.quantity > 0;

    itemHTML += `
      <div class="item-container">
        <div class="img-container">
          <div class="quantity-div">
            <p class="quantity">${item.quantity}</p>
          </div>
          <img src="${item.image}" alt="${item.name}">
        </div>
        <p class="item-name">${item.name}</p>
        <button class="rqst-btn" data-item-id="${item.id}" ${isAvailable ? '' : 'disabled'}>
          ${availabilityText}
        </button>
      </div>
    `;
  });

  const availableItemDiv = document.querySelector('.available-item');
  availableItemDiv.innerHTML = itemHTML;

  // Attach event listeners
  document.querySelectorAll('.rqst-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const itemId = button.dataset.itemId;
      const product = itemMap[itemId];
      console.log(itemId);

      document.querySelectorAll('.rqst-btn').forEach(btn => btn.disabled = true);
      availableItemDiv.classList.add('no-scroll');

      let formHTML = `
        <button class="close-button js-close-button">
          <img src="asset/icons/close-icon.png" alt="Close" /> 
        </button>        
        <div class="form-left">
        <div class="gc-logo">
          <img src="asset/image/CCS-GCLOGO.png" alt="Gordon College Logo" class="logo" />
          <h1 class="college-title">GORDON COLLEGE</h1>
        </div>
        <p class="unit">Management Information Unit - MIS Unit</p>

          <form>
            <label for="borrowed-date">Borrowed Date</label>
            <input id="borrowed-date" class="borrowed-date" type="date" required />

            <label for="return-date">Return Date</label>
            <input id="return-date" class="return-date" type="date" required />
            <!-- Error Message Container (hidden by default) -->
                    <div id="error-message" class="error-message">
                        <i class='bx bx-error-circle'></i>
                        <span>Invalid date.</span>
                    </div>
            <textarea class="purpose" placeholder="Remark/Purpose:" required></textarea>
            <button class="submit-button-request" type="submit" data-img="${product.image}" data-product-name="${product.name}">BORROW</button>
          </form>
        </div>

        <div class="form-right">
          <h2><u>BORROWER’S FORM</u></h2>
          <img src="${product.image}" alt="${product.name}" class="tv-icon" />
          <p class="tv-label">${product.name}</p>
          <div class="notice">
            <strong>Notice:</strong>
            <p>This item/equipment belongs to Gordon College. The borrower agrees to accept responsibility for the return of this equipment on time, and to return the equipment in the same functional condition, with all included accessories if any. If damage occurs to the item/equipment, repair or replacement with the same unit and model shall be at the expense of the borrower.</p>
          </div>
        </div>
      `;

      let container = document.createElement('div');
      container.classList.add('container');
      container.innerHTML = formHTML;
      mainDashboard.appendChild(container);

      printYourrequestInfo();

      container.querySelector('.js-close-button').addEventListener('click', () => {
        container.remove();
        availableItemDiv.classList.remove('no-scroll');
        document.querySelectorAll('.rqst-btn').forEach(btn => btn.disabled = false);
        updateRequestButtonStates();
      });
    });
  });
}



// 🎯 Main
document.addEventListener("DOMContentLoaded", async () => {
  await displayItems();
 
});
