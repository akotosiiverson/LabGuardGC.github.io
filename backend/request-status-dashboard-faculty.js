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

// Simple fullscreen image viewer with zoom/pan
function openImageViewer(src) {
  // Prevent multiple viewers
  if (document.querySelector('.image-viewer-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'image-viewer-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999;
    display: flex; align-items: center; justify-content: center; cursor: grab;
  `;

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = `
    position: absolute; top: 16px; right: 16px; display: flex; gap: 8px;
  `;
  const makeBtn = (label, title) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.title = title;
    btn.style.cssText = `
      background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.25);
      padding: 6px 10px; border-radius: 6px; font-size: 14px; cursor: pointer;
      backdrop-filter: blur(2px);
    `;
    btn.onmouseenter = () => (btn.style.background = 'rgba(255,255,255,0.2)');
    btn.onmouseleave = () => (btn.style.background = 'rgba(255,255,255,0.1)');
    return btn;
  };

  const btnZoomIn = makeBtn('+', 'Zoom In');
  const btnZoomOut = makeBtn('−', 'Zoom Out');
  const btnReset = makeBtn('Reset', 'Reset Zoom');
  const btnClose = makeBtn('×', 'Close');
  toolbar.append(btnZoomIn, btnZoomOut, btnReset, btnClose);

  // Image container
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Report Image';
  img.style.cssText = `
    max-width: 90vw; max-height: 85vh; user-select: none; pointer-events: none;
    transform-origin: center center; transition: transform 80ms ease-out;
  `;

  const imgWrap = document.createElement('div');
  imgWrap.style.cssText = `
    position: relative; overflow: hidden; touch-action: none;
  `;
  imgWrap.appendChild(img);

  overlay.append(toolbar, imgWrap);
  document.body.appendChild(overlay);

  // State for zoom/pan
  const state = { scale: 1, min: 0.5, max: 4, tx: 0, ty: 0, panning: false, startX: 0, startY: 0 };

  const apply = () => {
    img.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
  };

  const zoomBy = (factor) => {
    state.scale = Math.min(state.max, Math.max(state.min, state.scale * factor));
    apply();
  };

  const reset = () => {
    state.scale = 1; state.tx = 0; state.ty = 0; apply();
  };

  // Events
  btnZoomIn.onclick = () => zoomBy(1.2);
  btnZoomOut.onclick = () => zoomBy(1/1.2);
  btnReset.onclick = reset;
  btnClose.onclick = () => document.body.removeChild(overlay);

  overlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    zoomBy(delta);
  }, { passive: false });

  const onDown = (x, y) => {
    state.panning = true; state.startX = x - state.tx; state.startY = y - state.ty; overlay.style.cursor = 'grabbing';
  };
  const onMove = (x, y) => {
    if (!state.panning) return; state.tx = x - state.startX; state.ty = y - state.startY; apply();
  };
  const onUp = () => { state.panning = false; overlay.style.cursor = 'grab'; };

  // Mouse
  overlay.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onUp);

  // Touch (single finger pan)
  overlay.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  overlay.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  overlay.addEventListener('touchend', onUp);

  // Close with Escape or background double click
  const onKey = (e) => { if (e.key === 'Escape') btnClose.onclick(); };
  document.addEventListener('keydown', onKey, { once: true });
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
          <td data-label="action"><span class="view-details td-name-clickable" ><i class='bx bx-info-circle'></i> View Details</span></td>
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

      // Enable fullscreen zoomable view on image click
      const modalImg = modal.querySelector('.report-image');
      if (modalImg) {
        modalImg.style.cursor = 'zoom-in';
        modalImg.addEventListener('click', () => openImageViewer(imageSrc));
      }
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
