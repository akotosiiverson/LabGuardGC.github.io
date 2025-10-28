import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  addDoc,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../../backend/firebase-config.js";
let currentStatusFilter = "All";
let currentStartDate = null;
let currentEndDate = null;

function setupRealtimeListener() {
  const reportListEl = document.querySelector('.report-list');
  if (!reportListEl) return;

  const reportsQuery = query(collection(db, "reportList"), orderBy("date", "desc"));

  onSnapshot(reportsQuery, (querySnapshot) => {
    let reportSummary = '';

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const status = data.statusReport || 'Pending';
      const firestoreDate = data.date?.toDate?.();

      if (currentStatusFilter !== "All" && status.toLowerCase() !== currentStatusFilter.toLowerCase()) return;

      if (firestoreDate) {
        if (currentStartDate && firestoreDate < currentStartDate) return;
        if (currentEndDate && firestoreDate > currentEndDate) return;
      }

      const formattedDate = firestoreDate
        ? firestoreDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'No Date';

      let actionButtons = '';
      if (status === "Pending") {
        actionButtons = `
          <button class="approve-btn-js status" data-id="${docSnap.id}">Approve</button>
          <button class="processing-btn-js status" data-id="${docSnap.id}">Processing</button>
          <button class="remove-btn-js status" data-id="${docSnap.id}">Remove</button>
        `;
      } else if (status === "Processing") {
        actionButtons = `
          <button class="approve-btn-js status" data-id="${docSnap.id}">Approve</button>
          <button class="remove-btn-js status" data-id="${docSnap.id}">Remove</button>
        `;
      } else {
        actionButtons = `<strong class="${status}">${status}</strong>`;
      }

      reportSummary += `
        <tr class="report-row"
            data-status="${status}"
            data-id="${docSnap.id}"
            data-full-name="${data.fullName}"
            data-date="${formattedDate}"
            data-location="${data.room} - ${data.pc}"
            data-product="${data.equipment}"
            data-img="${data.imageUrl || ''}"
            data-remarks="${data.remarks || ''}"
            data-issue="${data.issue || ''}"
            data-position="${data.position || 'Faculty'}">
          <td data-label="faculty name">${data.fullName}</td>
          <td data-label="date">${formattedDate}</td>
          <td data-label="Room & PC No.">${data.room} - ${data.pc}</td>
          <td data-label="unit">${data.equipment}</td>
          <td data-label="status"><span class="status status-span-row">${actionButtons}</span></td>
          <td data-label="action">
            <span class="view-details td-name-clickable">
              <i class='bx bx-info-circle'></i> View Details
            </span>
          </td>
        </tr>
      `;
    });

    reportListEl.innerHTML = reportSummary;
    attachModalAndActionListeners();
    attachEventListeners();  // Re-bind action buttons after DOM update
  });
}

function attachModalAndActionListeners() {
  document.querySelectorAll('.td-name-clickable').forEach(cell => {
    cell.addEventListener('click', async () => {
      const row = cell.closest('.report-row');
      const { fullName, date, location, product, remarks, position, img, status, issue } = row.dataset;
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

function showReportDetailsModal(data) {
  const modal = document.createElement('div');
  modal.classList.add('details-modal');
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
              <span class="detail-value">${data.fullName} (${data.position || 'Faculty'})</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">${data.statusReport}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date Submitted:</span>
              <span class="detail-value">${new Date(data.date.toDate()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Room & PC:</span>
              <span class="detail-value">${data.room} - ${data.pc}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Item Type:</span>
              <span class="detail-value">${data.equipment}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Remarks:</span>
              <span class="detail-value">${data.remarks || 'No remarks provided'}</span>
            </div>
          </div>
          <div class="details-right">
            <img src="${data.imageUrl || '/path/to/default-image.png'}" alt="Report Image" class="report-image" />
          </div>
        </div>
      </div>
    </div>
  `;

  // Append modal to the body
  document.body.appendChild(modal);

  // Close modal functionality
  modal.querySelector('.details-modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

const updateStatus = async (id, status, button) => {
  try {
    const reportRef = doc(db, "reportList", id);
    await updateDoc(reportRef, { statusReport: status });

    if (status === "Approved") {
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) {
        console.error(`❌ Report with ID ${id} not found`);
        return;
      }

      const reportData = reportSnap.data();
      const { pc, room, equipment, issue, date } = reportData;

      const formattedDate = typeof date === "object" && date.toDate
        ? `${date.toDate().toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            dateStyle: 'long',
            timeStyle: 'medium'
          })} UTC+8`
        : date;

      // Add new document to the pc subcollection
      const pcCollectionRef = collection(db, "comlabrooms", room.toString(), `pc${pc}`);
      await addDoc(pcCollectionRef, {
        equipment,
        issue,
        reportDate: formattedDate,
        statusReport: status,
        approvedDate: serverTimestamp()
      });

      console.log(`✅ New report added to /comlabrooms/${room}/pc${pc}/`);

      const reportsQuery = query(
        collection(db, "reportList"),
        where("pc", "==", pc),
        where("room", "==", room)
      );
      const reportsSnapshot = await getDocs(reportsQuery);

      let allResolved = true;
      reportsSnapshot.forEach(doc => {
        const data = doc.data();
        const rStatus = data.statusReport;
        if (rStatus !== "Approved" && rStatus !== "Removed") {
          allResolved = false;
        }
      });

      const pcRef = doc(db, "comlabrooms", room.toString(), `pc${pc}`, "document1");
      if (allResolved) {
        await updateDoc(pcRef, { status: "available" });
      } else {
        await updateDoc(pcRef, { status: "not available" });
      }

    } else if (status === "Processing") {
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) {
        console.error(`❌ Report with ID ${id} not found`);
        return;
      }
      const { pc, room } = reportSnap.data();
      const pcRef = doc(db, "comlabrooms", room.toString(), `pc${pc}`, "document1");
      await updateDoc(pcRef, { status: "not available" });
    }

    if (status === 'Processing') {
      button.remove();
    } else {
      button.parentElement.innerHTML = `<strong>${status}</strong>`;
    }
  } catch (err) {
    console.error(`❌ Failed to update status:`, err);
  }
};

const attachEventListeners = () => {
  // Approve Button
  document.querySelectorAll('.approve-btn-js').forEach(button => {
    button.addEventListener('click', () => {
      // Create the confirmation modal for "Approve"
      const modal = document.createElement('div');
      modal.classList.add('confirmation-modal');
      modal.innerHTML = `
        <div class="modal-content">
          <h3 class="modal-title">Approve Request</h3>
          <p class="modal-message">Are you sure you want to approve this request?</p>
          <div class="modal-actions">
            <button class="confirm-btn">Confirm</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      // Append modal to the body
      document.body.appendChild(modal);

      // Handle Confirm button
      modal.querySelector('.confirm-btn').addEventListener('click', async () => {
        await updateStatus(button.dataset.id, "Approved", button);
        document.body.removeChild(modal); // Remove modal
      });

      // Handle Cancel button
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal); // Remove modal
      });
    });
  });

  // Processing Button
  document.querySelectorAll('.processing-btn-js').forEach(button => {
    button.addEventListener('click', () => {
      // Create the confirmation modal for "Processing"
      const modal = document.createElement('div');
      modal.classList.add('confirmation-modal');
      modal.innerHTML = `
        <div class="modal-content">
          <h3 class="modal-title">Process Request</h3>
          <p class="modal-message">Are you sure you want to process this request?</p>
          <div class="modal-actions">
            <button class="confirm-btn">Confirm</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      // Append modal to the body
      document.body.appendChild(modal);

      // Handle Confirm button
      modal.querySelector('.confirm-btn').addEventListener('click', async () => {
        await updateStatus(button.dataset.id, "Processing", button);
        document.body.removeChild(modal); // Remove modal
      });

      // Handle Cancel button
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal); // Remove modal
      });
    });
  });

  // Remove Button
  document.querySelectorAll('.remove-btn-js').forEach(button => {
    button.addEventListener('click', () => {
      // Create the confirmation modal for "Remove"
      const modal = document.createElement('div');
      modal.classList.add('confirmation-modal');
      modal.innerHTML = `
        <div class="modal-content">
          <h3 class="modal-title">Remove Request</h3>
          <p class="modal-message">Are you sure you want to remove this request?</p>
          <div class="remarks-section">
            <label for="remarks" class="remarks-label">Remarks:</label>
            <textarea id="remarks" placeholder="Enter your remarks here..." required class="remarks-input"></textarea>
            <p class="error-message" style="color: red; display: none; margin-top: 5px;">Remarks are required to remove the request.</p>
          </div>
          <div class="modal-actions">
            <button class="confirm-btn">Confirm</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      // Append modal to the body
      document.body.appendChild(modal);

      // Handle Confirm button
      modal.querySelector('.confirm-btn').addEventListener('click', async () => {
        const remarksInput = modal.querySelector('.remarks-input').value.trim();
        const errorMessage = modal.querySelector('.error-message');

        if (!remarksInput) {
          // Show error message inside the modal
          errorMessage.style.display = 'block';

          // Hide the error message after 1.5 seconds
          setTimeout(() => {
            errorMessage.style.display = 'none';
          }, 1500);

          return;
        }

        try {
          // Update Firestore with the remarks
          const reportRef = doc(db, "reportList", button.dataset.id);
          await updateDoc(reportRef, {
            statusReport: "Removed",
            remarks: remarksInput
          });

          console.log(`✅ Request removed with remarks: ${remarksInput}`);
          updateStatus(button.dataset.id, "Removed", button); // Update UI
        } catch (err) {
          console.error("❌ Failed to save remarks:", err);
          alert("An error occurred while saving the remarks.");
        }

        document.body.removeChild(modal); // Remove modal
      });

      // Handle Cancel button
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal); // Remove modal
      });
    });
  });
}

// Event Listeners on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  setupRealtimeListener();

  const filterSelect = document.querySelector('#sortingReequest');
  const startDateInput = document.querySelector('#startDate');
  const endDateInput = document.querySelector('#endDate');

  filterSelect.addEventListener('change', () => {
    const selected = filterSelect.value;
    if (selected === "process-sort") currentStatusFilter = "Processing";
    else if (selected === "pending-sort") currentStatusFilter = "Pending";
    else if (selected === "approve-sort") currentStatusFilter = "Approved";
    else if (selected === "remove-sort") currentStatusFilter = "Removed";
    else currentStatusFilter = "All";

    setupRealtimeListener();
  });

  const handleDateChange = () => {
    const startVal = startDateInput.value;
    const endVal = endDateInput.value;

    currentStartDate = startVal ? new Date(startVal) : null;
    currentEndDate = endVal ? new Date(endVal) : null;

    if (currentEndDate) currentEndDate.setHours(23, 59, 59, 999);
    setupRealtimeListener();
  };

  startDateInput.addEventListener("change", handleDateChange);
  endDateInput.addEventListener("change", handleDateChange);
});
