import { printYourrequestInfo } from '../backend/reportForm.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

export const mainDashboard = document.querySelector('.dashboard');
import {
  db,
} from "./firebase-config.js";
const itemMap = {}; // Store items for quick lookup

// Default text if admin hasn't configured anything yet
const defaultNoticeText = "This report form is intended for reporting any issues with laboratory equipment at Gordon College. If you encounter a problem, please complete the form with accurate details to ensure timely inspection and resolution by the Management Information Unit (MIS).";

function escapeHtml(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getReportNoticeText() {
  try {
    const ref = doc(db, 'formTexts', 'borrowForm');
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().noticeText) return String(snap.data().noticeText);
    return defaultNoticeText;
  } catch (err) {
    console.error('Failed to load notice text:', err);
    return defaultNoticeText;
  }
}

function buildNoticeHtml(text) {
  const safeText = escapeHtml(text);
  return `
            <div class="notice">
              <strong>Important Information:</strong>
              <p>${safeText}</p>
            </div>`;
}

async function displayItems() {
  try {
    const querySnapshot = await getDocs(collection(db, "reportItem"));
    const items = [];

    querySnapshot.forEach((doc) => {
      const item = { id: doc.id, ...doc.data() };
      items.push(item);
      itemMap[item.id] = item;
    });
// Sort items alphabetically by item.name, placing 'OTHERS' at the end
items.sort((a, b) => {
  if (a.name === 'OTHERS') return 1; // Place 'OTHERS' at the end
  if (b.name === 'OTHERS') return -1; // Place 'OTHERS' at the end
  return a.name.localeCompare(b.name); // Sort alphabetically
});
    let itemHTML = '';
    items.forEach((item) => {
      itemHTML += `
        <div class="item-container">
          <div class="img-container">
            <img src="${item.image}" alt="Computer Icon">
          </div>
          <p class="item-name">${item.name}</p>
          <button class="rqst-btn" data-item-id="${item.id}">REPORT</button>
        </div>
      `;
    });
/*
    const othersData = { id: 13, name: 'OTHERS', image: '/ADMIN/asset/icons/others-icon.png' };
    const addItemHTML = `
      <div class="item-container">
        <div class="img-container">
          <img src="${othersData.image}" alt="Others Icon">    
        </div>
        <p class="item-name">${othersData.name}</p>
        <button class="rqst-btn" data-item-id="${othersData.id}">OTHERS</button>
      </div>
    `;
*/
    itemHTML ;
    document.querySelector('.available-item').innerHTML = itemHTML;

    document.querySelectorAll('.rqst-btn').forEach((button) => {
      button.addEventListener('click', async () => {
       const itemId = button.dataset.itemId;
      const product = itemMap[itemId];
        // Handle "OTHERS" case
        /*
        if (!product && +button.dataset.itemId === 13) {
          product = { id: 13, name: 'OTHERS', image: '/ADMIN/asset/icons/others-icon.png' };
        }
          */
        console.log(product);
        document.querySelectorAll('.rqst-btn').forEach((btn) => {
          btn.disabled = true;
        });
        document.querySelector('.available-item').classList.add('no-scroll');

        const noticeHtml = buildNoticeHtml(await getReportNoticeText());

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
              <select class="room-number" required>
                <option value="" disabled selected>Select Room</option>
                <option value="517">517</option>
                <option value="518">518</option>
                <option value="519">519</option>
                <option value="520">520</option>
                <option value="521">521</option>
                <option value="522">522</option>
                <option value="523">523</option>
                <option value="524">524</option>
                <option value="525">525</option>
              </select>
              <select id="pc-number" class="pc-number" required>
                <option value="" disabled selected>Select Pc</option>
              </select>
              <div class="file-input-container">
                <label for="upload-report-image" class="file-input-label">
                  <i class='bx bx-upload'></i>
                  <span>Upload Image (Optional)</span>
                </label>
                <input type="file" id="upload-report-image" class="upload-report-image" accept="image/*" />
              </div>

              <!-- Error Message Container (hidden by default) -->
              <div id="error-message" class="error-message">
                <i class='bx bx-error-circle'></i>
                <span>Please complete all required fields.</span>
              </div>

              <textarea class="issue" placeholder="Problem/issue:" required></textarea>
              <!-- Agreement error (hidden by default) -->
              <div id="agreement-error" class="agreement-error">
                        <i class='bx bx-error-circle'></i>
                      - <span>Please acknowledge and accept Gordon College\'s Terms and Policies before proceeding.</span>
                    </div>

              <!-- Agreement checkbox -->
              <div class="agreement-row" style="margin-top:12px;display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="report-agree-checkbox" class="report-agree-checkbox" />
                <label for="report-agree-checkbox" style="margin:0;">I agree to Gordon College Terms & Policy</label>
              </div>

              

              <button class="submit-button-request js-submit-button-report" type="submit" data-product-name="${product.name}">SUBMIT</button>
            </form>
          </div>

          <div class="form-right">
            <h2><u>REPORT FORM</u></h2>
            <img src="${product.image}" data-report-image="${product.image}" alt="${product.name}" class="tv-icon report-image" />
            <p class="tv-label">${product.name}</p>
            ${noticeHtml}
            <!-- Terms & Policy Modal -->
       

          </div>
        `;

        let container = document.createElement('div');
        container.classList.add('container');
        container.innerHTML = formHTML;
        mainDashboard.appendChild(container);

        const selectPc = container.querySelector('#pc-number');
        for (let i = 1; i <= 30; i++) {
          const option = document.createElement('option');
          option.value = `${i}`;
          option.textContent = `PC ${i}`;
          selectPc.appendChild(option);
        }

        printYourrequestInfo();

        container.querySelector('.js-close-button').addEventListener('click', function () {
          container.remove();
          document.querySelector('.available-item').classList.remove('no-scroll');
          document.querySelectorAll('.rqst-btn').forEach((btn) => {
            btn.disabled = false;
            updateRequestButtonStates();
          });
        });
      });
    });
  } catch (error) {
    console.error("Error fetching items from Firestore:", error);
  }
}

function updateRequestButtonStates() {
  document.querySelectorAll('.rqst-btn').forEach((btn) => {
    const itemId = +btn.dataset.itemId;
    const item = itemMap[itemId];
    if (item) {
      btn.disabled = false;
      btn.textContent = 'REPORT';
    }
  });
}

// Call the function to display items
document.addEventListener("DOMContentLoaded", displayItems);

// Modified addReport function to handle image upload
export async function addReport(statusReport, equipment, issue, pc, room, date, imageFile) {
  try {
    let imageUrl = null;

    // If an image file is provided, upload it to Firebase Storage
    if (imageFile) {
      // Create a reference to the storage location
      const storageRef = ref(storage, `report-images/${Date.now()}_${imageFile.name}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, imageFile);

      // Get the download URL
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // Add the report to Firestore with the image URL
    const docRef = await addDoc(collection(db, "reportList"), {

      equipment,
      issue,
      pc,
      room,
      date,
      imageUrl,// Add the image URL to the document
      statusReport,
      timestamp: serverTimestamp()
    });

    const docId = docRef.id;
    console.log("Report added successfully with ID:", docId);
    return docId;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e; // Re-throw the error to handle it in the calling code
  }
}

