import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  db,
} from "./firebase-config.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Global filters
let currentStatusFilter = "All";
let currentStartDate = null;
let currentEndDate = null;
const auth = getAuth();
let currentUserId = null;

// Renders the reports table using real-time updates
function renderRequestStatus() {
  const reportListEl = document.querySelector('.report-list');
  if (!reportListEl) {
    console.warn('⚠️ .report-list not found in DOM.');
    return;
  }

  if (!currentUserId) {
    console.warn('⚠️ No logged-in user found.');
    return;
  }

  // Query Firestore for reports belonging to the logged-in user
  const reportsQuery = query(
    collection(db, "reportList"),
    where("userId", "==", currentUserId), // Filter by userId
    orderBy("date", "desc")
  );

  onSnapshot(reportsQuery, (querySnapshot) => {
    let reportSummary = '';

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const jsDate = data.date?.toDate?.();
      if (!jsDate) return;

      // Apply date range filter
      if (currentStartDate && jsDate < currentStartDate) return;
      if (currentEndDate && jsDate > currentEndDate) return;

      const status = data.statusReport || 'Pending';
      // Apply status filter
      if (currentStatusFilter !== "All" && status.toLowerCase() !== currentStatusFilter.toLowerCase()) return;

      const formattedDate = jsDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      reportSummary += `
        <tr class="report-row"
            data-full-name="${data.fullName}"
            data-status="${status}"
            data-date="${formattedDate}"
            data-location="${data.room} - ${data.pc}"
            data-product="${data.equipment}"
            data-img="${data.imageUrl || ''}"
            data-issue="${data.issue || 'No details provided'}"            data-position="${data.position || 'Faculty'}"
            data-remarks="${data.remarks || ''}"> <!-- Include remarks -->
          <td data-label="Faculty Name">${data.fullName || 'Unknown'}</td>
          <td data-label="date">${formattedDate}</td>
          <td data-label="Room & PC No.">${data.room} - ${data.pc}</td>
          <td data-label="unit">${data.equipment}</td>
          <td data-label="status"><span class="status status--${status.toLowerCase()}">${status}</span></td>
          <td><span class="view-details td-name-clickable" ><i class='bx bx-info-circle'></i> View Details</span></td>
        </tr>
      `;
    });

    reportListEl.innerHTML = reportSummary;
    attachModalAndActionListeners();
  });
}

// Handles the click logic for each row to show details modal
function attachModalAndActionListeners() {
  document.querySelectorAll('.td-name-clickable').forEach(cell => {
    cell.addEventListener('click', () => {
      const row = cell.closest('.report-row');
      const { fullName, date, location, product, issue, position, img, status, remarks } = row.dataset;
      const imageSrc = img
        ? img
        : 'https://firebasestorage.googleapis.com/v0/b/labsystem-bd9ad.firebasestorage.app/o/icon%2FnoImage.png?alt=media&token=a6517e64-7d82-4959-b7a9-96b20651864d';

      let modal = document.querySelector('.details-modal');

      if (!modal) {
        modal = document.createElement('div');
        modal.classList.add('details-modal');
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="details-modal-content">
          <div class="details-modal-header">
            <h3 class="details-modal-title">Report Details</h3>
            <button class="details-modal-close">&times;</button>
          </div>
          <div class="details-modal-body">
            <div class="details-wrapper">
              <div class="details-left">
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">${fullName} (${position})</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value">${status}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date Submitted:</span>
                  <span class="detail-value">${date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Room & PC:</span>
                  <span class="detail-value">${location}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Item Type:</span>
                  <span class="detail-value">${product}</span>
                </div>
                ${
                  remarks
                    ? `<div class="detail-row">
                        <span class="detail-label">Remarks:</span>
                        <span class="detail-value">${remarks}</span>
                      </div>`
                    : `<div class="detail-row">
                        <span class="detail-label">Issue:</span>
                        <span class="detail-value">${issue || 'No issue provided'}</span>
                      </div>`
                }
              </div>
              <div class="details-right">
                <img src="${imageSrc}" alt="Report Image" class="report-image" />
              </div>
            </div>
          </div>
        </div>
      `;

      modal.classList.add('active');

      const closeButton = modal.querySelector('.details-modal-close');
      closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
      });

      // Optional: close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  });
}

// Filter listeners
function setupFilters() {
  const filterSelect = document.querySelector('#sortingReequest');
  const startDateInput = document.querySelector('#startDate');
  const endDateInput = document.querySelector('#endDate');

  filterSelect.addEventListener('change', () => {
    const selected = filterSelect.value;
    if (selected === "process-sort") currentStatusFilter = "Processing";
    else if (selected === "pending-sort") currentStatusFilter = "Pending";
    else if (selected === "approve-sort") currentStatusFilter = "Approved";
    else if (selected === "decline-sort") currentStatusFilter = "Declined";
    else currentStatusFilter = "All";

    renderRequestStatus();
  });

  [startDateInput, endDateInput].forEach(input => {
    input.addEventListener('change', () => {
      currentStartDate = startDateInput.value ? new Date(startDateInput.value) : null;
      currentEndDate = endDateInput.value ? new Date(endDateInput.value) : null;

      if (currentEndDate) {
        // Set to end of the day //
        currentEndDate.setHours(23, 59, 59, 999);
      }

      renderRequestStatus();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();

  // Wait for the authentication state to be determined
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid; // Get the logged-in user's ID
      console.log(`Logged-in user ID: ${currentUserId}`);
      renderRequestStatus(); // Call the function after getting the user
    } else {
      console.warn("No user is logged in.");
      // Optionally, clear the report list or show a message
      const reportListEl = document.querySelector('.report-list');
      if (reportListEl) {
        reportListEl.innerHTML = '<tr><td colspan="5">Please log in to view your requests.</td></tr>';
      }
    }
  });
});
