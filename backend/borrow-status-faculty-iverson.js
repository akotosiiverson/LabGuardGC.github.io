import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,getDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  db,
} from "./firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Global filters
let currentStatusFilter = "all";
let currentStartDate = null;
let currentEndDate = null;
let currentUserId = null;

// Normalize status values to consistent format
function normalizeStatus(rawStatus) {
  const lower = (rawStatus || 'pending').trim().toLowerCase();
  if (lower === "approve") return "approved";
  if (lower === "decline") return "declined";
  return lower; // default is 'pending' or other values
}

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

  // Query Firestore for borrow requests belonging to the logged-in user
  // Using a simpler query to avoid index requirements
  const reportsQuery = query(
    collection(db, "borrowList"),
    where("userId", "==", currentUserId) // Filter by userId only
  );

  onSnapshot(reportsQuery, (querySnapshot) => {
    let reportSummary = '';

    // Counters to aggregate log output (avoid per-document logging)
    let processedCount = 0;
    let displayedCount = 0;
    const counts = { pending: 0, approved: 0, declined: 0 };

    // Convert to array and sort by timestamp (newest first)
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    })).sort((a, b) => {
      const timestampA = a.data.timestamp?.toDate?.() || new Date(a.data.timestamp || 0);
      const timestampB = b.data.timestamp?.toDate?.() || new Date(b.data.timestamp || 0);
      return timestampB - timestampA; // Newest first
    });

    docs.forEach(({ id, data }) => {
      const jsDate = data.timestamp?.toDate?.();
      if (!jsDate) return;

      // Apply date range filter
      if (currentStartDate && jsDate < currentStartDate) return;
      if (currentEndDate && jsDate > currentEndDate) return;

      // Track counts and avoid logging per document
      const status = normalizeStatus(data.statusReport);
      processedCount++;
      if (status === 'pending') counts.pending++;
      else if (status === 'approved') counts.approved++;
      else if (status === 'declined') counts.declined++;

      // Apply status filter
      if (currentStatusFilter !== "all" && status !== currentStatusFilter) return;

      displayedCount++;

      const formattedDate = jsDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
          reportSummary += `
       <tr class="report-row"
            data-id="${id}"
          data-date="${formattedDate}"
          data-status="${status}"
          data-borrow-date="${data.borrowDate}"
          data-return-date="${data.returnDate}"
          data-product="${data.equipment}"
          data-img="${data.downloadURL || ''}"
          data-purpose="${data.purpose || 'No details provided'}"
          data-remarks="${data.remarks || data.remark || ''}"
          data-full-name="${data.fullName || 'Unknown'}">
          <td data-label="Faculty Name">${data.fullName || 'Unknown'}</td>
          <td data-label="Request Date">${formattedDate}</td>
         <td data-label="Borrow Date">${new Date(data.borrowDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })}</td>
        <td data-label="Return Date">${new Date(data.returnDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })}</td>
          <td data-label="unit">${data.equipment}</td>
          <td data-label="status"><span class="status status--${status}">${status}</span></td>
          <td data-label="action"> <span class="view-details td-name-clickable" ><i class='bx bx-info-circle'></i> View Details</span></td>
        </tr>
      `;
    });

    reportListEl.innerHTML = reportSummary;
    attachModalAndActionListeners();

    // Single aggregated log per snapshot to reduce storage/console noise
    console.log(`BorrowList snapshot: processed=${processedCount}, displayed=${displayedCount}, pending=${counts.pending}, approved=${counts.approved}, declined=${counts.declined}, filter=${currentStatusFilter}`);
  });
}

// Handles the click logic for each row to show details modal
function attachModalAndActionListeners() {
  document.querySelectorAll('.td-name-clickable').forEach(cell => {
    cell.addEventListener('click', async () => {
      const row = cell.closest('.report-row');
      const { fullName, date, returnDate, borrowDate, product, img, status, purpose, id, remarks: rowRemarks } = row.dataset;
      const imageSrc = img
        ? img
        : 'https://firebasestorage.googleapis.com/v0/b/labsystem-bd9ad.firebasestorage.app/o/icon%2FnoImage.png?alt=media&token=a6517e64-7d82-4959-b7a9-96b20651864d';

      let modal = document.querySelector('.details-modal');

      if (!modal) {
        modal = document.createElement('div');
        modal.classList.add('details-modal');
        document.body.appendChild(modal);
      }      // Fetch remarks from Firestore
      let remarks = rowRemarks || ''; // Start with remarks from row data
      try {
        const reportRef = doc(db, "borrowList", id);
        const reportSnap = await getDoc(reportRef);
        if (reportSnap.exists()) {
          const docData = reportSnap.data();
          remarks = docData.remarks || docData.remark || remarks; // Use fetched remarks if available
          console.log('Document data:', docData);
          console.log('Remarks found:', remarks);
        } else {
          console.log('Document does not exist with ID:', id);
        }
      } catch (err) {
        console.error("❌ Failed to fetch remarks:", err);
      }

      // Display remarks or fallback to purpose
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
                  <span class="detail-value">${fullName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value">${status}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Equipment:</span>
                  <span class="detail-value">${product}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date Submitted:</span>
                  <span class="detail-value">${date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Borrow Date:</span>
                  <span class="detail-value">${new Date(borrowDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Return Date:</span>
                  <span class="detail-value">${new Date(returnDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}</span>
                </div>
                ${
                  remarks
                    ? `<div class="detail-row">
                        <span class="detail-label">Remarks:</span>
                        <span class="detail-value">${remarks}</span>
                      </div>`
                    : `<div class="detail-row">
                        <span class="detail-label">Purpose:</span>
                        <span class="detail-value">${purpose}</span>
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
    if (selected === "pending-sort") currentStatusFilter = "pending";
    else if (selected === "approve-sort") currentStatusFilter = "approved";
    else if (selected === "decline-sort") currentStatusFilter = "declined";
    else currentStatusFilter = "all";

    renderRequestStatus();
  });

  [startDateInput, endDateInput].forEach(input => {
    input.addEventListener('change', () => {
      currentStartDate = startDateInput.value ? new Date(startDateInput.value) : null;
      currentEndDate = endDateInput.value ? new Date(endDateInput.value) : null;

      if (currentEndDate) {
        currentEndDate.setHours(23, 59, 59, 999); // Include full day
      }

      renderRequestStatus();
    });
  });
}

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid; // Get the logged-in user's ID
    console.log(`Logged-in user ID: ${currentUserId}`);
    // Small delay to ensure currentUserId is set before calling renderRequestStatus
    setTimeout(() => {
      renderRequestStatus();
    }, 100);
  } else {
    console.warn("No user is logged in.");
    currentUserId = null;
    const reportListEl = document.querySelector('.report-list');
    if (reportListEl) {
      reportListEl.innerHTML = '<tr><td colspan="6">Please log in to view your borrow requests.</td></tr>';
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  // renderRequestStatus() is called in onAuthStateChanged
});
