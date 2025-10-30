import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
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

async function loadFormTexts() {
  try {
    const formTextsRef = doc(db, 'formTexts', 'borrowForm');
    const docSnap = await getDoc(formTextsRef);
    return docSnap.exists() ? docSnap.data() : {
      noticeText: "This item/equipment belongs to Gordon College...", // default
      termsText: "Please read and accept the terms..." // default
    };
  } catch (error) {
    console.error('Error loading form texts:', error);
    return null;
  }
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
    button.addEventListener('click', async () => {
      const itemId = button.dataset.itemId;
      const product = itemMap[itemId];

      // Load the form texts before creating the form
      const formTexts = await loadFormTexts();
      
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


             
                
            <!-- Agreement (single location) -->
            <div class="agreement-row" style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:nowrap;background:#f8f9fb;border:1px solid #e6e8eb;padding:10px;border-radius:8px;">
              <label for="agree-checkbox" style="display:flex;align-items:center;gap:8px;margin:0;cursor:pointer;">
                <input type="checkbox" id="agree-checkbox" class="agree-checkbox" style="width:18px;height:18px;margin:0;" />
                <span style="font-size:14px;">I agree to Gordon College Terms & Policy</span>
              </label>
              <button type="button" class="view-terms-btn" style="margin-left:auto;padding:6px 12px;cursor:pointer;background:#fff;border:1px solid #d0d7de;border-radius:6px;font-size:14px;">View Terms</button>
            </div>

            <div id="agreement-error" class="agreement-error">
                        <i class='bx bx-error-circle'></i>
                      - <span>Please acknowledge and accept Gordon College\'s Terms and Policies before proceeding.</span>
                    </div>
            <button class="submit-button-request" type="submit" data-img="${product.image}" data-product-name="${product.name}">BORROW</button>
          </form>
        </div>

        <div class="form-right">
          <h2><u>BORROWER’S FORM</u></h2>
          <img src="${product.image}" alt="${product.name}" class="tv-icon" />
          <p class="tv-label">${product.name}</p>
          <div class="notice">
            <strong>Notice:</strong>
            <p>${formTexts?.noticeText || 'Default notice text...'}</p>
          </div>
          
          <!-- Terms Modal -->
          <div class="borrow-terms-modal" style="display:none;">
            <div class="borrow-terms-modal-content" style="background:#fff;max-width:720px;width:90%;padding:16px;border-radius:8px;">
              <div class="borrow-terms-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
                <h3 style="margin:0;">Terms & Policy</h3>
                <button type="button" class="borrow-terms-close" aria-label="Close">&times;</button>
              </div>
              <div class="borrow-terms-body" style="white-space:pre-wrap;max-height:50vh;overflow:auto;">
                ${formTexts?.termsText || 'Default terms text...'}
              </div>
              <div class="borrow-terms-actions" style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
                <button type="button" class="borrow-terms-agree">I Agree</button>
                <button type="button" class="borrow-terms-close">Close</button>
              </div>
            </div>
          </div>
        </div>
      `;

      let container = document.createElement('div');
      container.classList.add('container');
      container.innerHTML = formHTML;
      mainDashboard.appendChild(container);

      // Keep terms modal behavior but remove any logic that ties the checkbox to submit behavior.
      (function simpleTermsModal() {
        const viewBtn = container.querySelector('.view-terms-btn');
        const termsModal = container.querySelector('.borrow-terms-modal');
        const modalCloseBtns = container.querySelectorAll('.borrow-terms-close');
        const modalAgree = container.querySelector('.borrow-terms-agree'); // optional: can check the box visually

        const openTerms = (e) => {
          if (e) e.preventDefault();
          if (!termsModal) return;
          termsModal.style.display = 'flex';
          termsModal.setAttribute('aria-hidden', 'false');
          termsModal.style.position = 'fixed';
          termsModal.style.inset = '0';
          termsModal.style.alignItems = 'center';
          termsModal.style.justifyContent = 'center';
          termsModal.style.background = 'rgba(0,0,0,0.45)';
          termsModal.style.zIndex = '9999';
        };

        const closeTerms = () => {
          if (!termsModal) return;
          termsModal.style.display = 'none';
          termsModal.setAttribute('aria-hidden', 'true');
        };

        viewBtn?.addEventListener('click', openTerms);
        modalCloseBtns?.forEach(b => b.addEventListener('click', closeTerms));

        // If the modal's "I Agree" button should simply close the modal (no submit logic), do that:
        modalAgree?.addEventListener('click', () => {
          // Optionally tick the checkbox when user agrees
          const agreeCb = container.querySelector('.agree-checkbox');
          if (agreeCb) agreeCb.checked = true;
          closeTerms();
        });

        // close modal on outside click
        termsModal?.addEventListener('click', (ev) => {
          if (ev.target === termsModal) closeTerms();
        });
      })();

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
