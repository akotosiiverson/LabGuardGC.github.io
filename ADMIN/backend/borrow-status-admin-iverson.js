import {
  orderBy, onSnapshot,
  doc, updateDoc, getDoc, collection, addDoc, serverTimestamp,
  query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../../backend/firebase-config.js";

let currentStatusFilter = "All";
let currentStartDate = null;
let currentEndDate = null;
let allReports = [];

function setupRealtimeListener() {
  const reportListEl = document.querySelector('.report-list');
  if (!reportListEl) return;

  const reportsQuery = query(collection(db, "borrowList"), orderBy("timestamp", "desc"));

  onSnapshot(reportsQuery, (querySnapshot) => {
    allReports = [];
    querySnapshot.forEach(docSnap => {
      allReports.push({ id: docSnap.id, ...docSnap.data(), timestamp: docSnap.data().timestamp?.toDate() });
    });

    renderFilteredReports();
  });
}

function renderFilteredReports() {
  const reportListEl = document.querySelector('.report-list');
  if (!reportListEl) return;

  let reportSummary = '';

  allReports.forEach(data => {
    const status = data.statusReport || 'Pending';
    const firestoreDate = data.timestamp;

    // Ensure the filter matches the status correctly
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
        <div class="action-buttons">
          <button class="approve-btn-js status" data-id="${data.id}">Approve</button>
          <button class="remove-btn-js status" data-id="${data.id}">Remove</button>
        </div>
      `;
    } else if (status === "Approved") {
      actionButtons = `
        <div class="action-buttons">
          <button class="return-btn-js status" data-id="${data.id}">Return</button>
        </div>
      `;
    } else {
      actionButtons = `<strong class="${status}">${status}</strong>`;
    }

    reportSummary += `
      <tr class="report-row"
          data-status="${status}"
          data-id="${data.id}"
          data-date="${formattedDate}"
          data-borrow-date="${data.borrowDate}"
          data-return-date="${data.returnDate}"
          data-product="${data.equipment}"
          data-img="${data.downloadURL || ''}"
          data-purpose="${data.purpose || 'No details provided'}"
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
          <td data-label="Unit">${data.equipment}</td>
          <td data-label="Status"><span class="status status--${status}">${actionButtons}</span></td>
          <td data-label="Action"><span class="view-details td-name-clickable" ><i class='bx bx-info-circle'></i> View Details</span></td>
      </tr>
    `;
  });

  reportListEl.innerHTML = reportSummary;
  attachModalAndActionListeners();
  attachEventListeners();
}

function attachModalAndActionListeners() {
  document.querySelectorAll('.td-name-clickable').forEach(cell => {
    cell.addEventListener('click', async () => {
      const row = cell.closest('.report-row');
      const { fullName, date, returnDate, borrowDate, product, img, purpose, status, id } = row.dataset;

      console.log(row.dataset.img);
      const imageSrc = img
        ? img
        : 'https://firebasestorage.googleapis.com/v0/b/labsystem-bd9ad.firebasestorage.app/o/icon%2FnoImage.png?alt=media&token=a6517e64-7d82-4959-b7a9-96b20651864d';

      let modal = document.querySelector('.details-modal');

      if (!modal) {
        modal = document.createElement('div');
        modal.classList.add('details-modal');
        document.body.appendChild(modal);
      }

      // Fetch remarks from Firestore
      let remarks = '';
      try {
        const reportRef = doc(db, "borrowList", id);
        const reportSnap = await getDoc(reportRef);
        if (reportSnap.exists()) {
          remarks = reportSnap.data().remarks || ''; // Get remarks if available
        }
      } catch (err) {
        console.error("❌ Failed to fetch remarks:", err);
      }

      modal.innerHTML = `
        <div class="details-modal-content">
          <div class="details-modal-header">
            <h3 class="details-modal-title">Borrow Details</h3>
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

      document.body.appendChild(modal);

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

const updateStatus = async (id, status, button) => {
  try {
    const reportRef = doc(db, "borrowList", id);
    await updateDoc(reportRef, { statusReport: status });

    if (status === "Approved") {
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) return;

      const reportData = reportSnap.data();
      const { equipment } = reportData;

      const itemQuery = query(collection(db, "borrowItem"), where("name", "==", equipment));
      const itemSnapshot = await getDocs(itemQuery);

      if (!itemSnapshot.empty) {
        const itemDoc = itemSnapshot.docs[0];
        const itemRef = itemDoc.ref;
        const currentQuantity = itemDoc.data().quantity || 0;

        if (currentQuantity > 0) {
          await updateDoc(itemRef, { quantity: currentQuantity - 1 });
          console.log(`✅ Quantity of ${equipment} decreased by 1.`);
        } else {
          // Show error message inside the modal
          const errorMessage = document.createElement('p');
          errorMessage.textContent = `The equipment "${equipment}" is not available.`;
          errorMessage.style.color = 'red';
          errorMessage.style.marginTop = '10px';
          errorMessage.style.textAlign = 'center';

          const modalContent = document.querySelector('.modal-content');
          modalContent.appendChild(errorMessage);

          // Remove the error message after 1.5 seconds
          setTimeout(() => {
            errorMessage.remove();
          }, 1500);

          return;
        }
      } else {
        // Show error message inside the modal
        const errorMessage = document.createElement('p');
        errorMessage.textContent = `The equipment "${equipment}" was not found in inventory.`;
        errorMessage.style.color = 'red';
        errorMessage.style.marginTop = '10px';
        errorMessage.style.textAlign = 'center';

        const modalContent = document.querySelector('.modal-content');
        modalContent.appendChild(errorMessage);

        // Remove the error message after 1.5 seconds
        setTimeout(() => {
          errorMessage.remove();
        }, 1500);

        return;
      }

      const returnButton = document.createElement("button");
      returnButton.textContent = "Return";
      returnButton.classList.add("return-btn-js");
      returnButton.dataset.id = id;

      const actionContainer = button.closest('.action-buttons');
      if (actionContainer) {
        actionContainer.innerHTML = "";
        actionContainer.appendChild(returnButton);
        actionContainer.style.display = "block";

        returnButton.addEventListener("click", async () => {
          await handleReturn(id, returnButton);
        });
      }
    }
  } catch (err) {
    console.error(`❌ Failed to update status:`, err);
  }
};

const handleReturn = async (id, button) => {
  try {
    button.disabled = true;
    button.textContent = "Processing...";

    const reportRef = doc(db, "borrowList", id);
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) throw new Error("Report not found");

    const { equipment } = reportSnap.data();

    const itemQuery = query(collection(db, "borrowItem"), where("name", "==", equipment));
    const itemSnapshot = await getDocs(itemQuery);

    if (!itemSnapshot.empty) {
      const itemDoc = itemSnapshot.docs[0];
      const itemRef = itemDoc.ref;
      const currentQuantity = itemDoc.data().quantity || 0;

      await updateDoc(itemRef, { quantity: currentQuantity + 1 });
      console.log(`✅ Quantity of ${equipment} increased by 1.`);
    } else {
      alert(`The equipment "${equipment}" was not found.`);
      return;
    }

    await updateDoc(reportRef, { statusReport: "Returned" });
    console.log(`✅ Report ${id} marked as Returned.`);

    button.parentElement.innerHTML = `<strong>Returned</strong>`;
  } catch (err) {
    console.error(`❌ Failed to return item:`, err);
    alert("An error occurred while returning the item.");
  }
};

const attachEventListeners = () => {
  document.querySelectorAll('.approve-btn-js').forEach(button => {
    button.addEventListener('click', () => {
      // Create the confirmation modal for "Approve"
      const modal = document.createElement('div');
      modal.classList.add('confirmation-modal');
      modal.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Approval</h3>
          <p>Are you sure you want to approve this request?</p>
          <div class="modal-actions">
            <button class="confirm-btn">Confirm</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      // Append modal to the body
      document.body.appendChild(modal);

      // Add opacity to the dashboard
      const dashboard = document.querySelector('.dashboard');
      if (dashboard) {
        dashboard.classList.add('modal-active');
      }

      // Handle Confirm button
      modal.querySelector('.confirm-btn').addEventListener('click', async () => {
        await updateStatus(button.dataset.id, "Approved", button);
        document.body.removeChild(modal); // Remove modal
        if (dashboard) {
          dashboard.classList.remove('modal-active'); // Remove opacity
        }
      });

      // Handle Cancel button
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal); // Remove modal
        if (dashboard) {
          dashboard.classList.remove('modal-active'); // Remove opacity
        }
      });
    });
  });

  document.querySelectorAll('.return-btn-js').forEach(button => {
    button.addEventListener('click', () => {
      // Create the confirmation modal for "Return"
      const modal = document.createElement('div');
      modal.classList.add('confirmation-modal');
      modal.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Return</h3>
          <p>Are you sure you want to mark this item as returned?</p>
          <div class="modal-actions">
            <button class="confirm-btn">Confirm</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      // Append modal to the body
      document.body.appendChild(modal);

      // Add opacity to the dashboard
      const dashboard = document.querySelector('.dashboard');
      if (dashboard) {
        dashboard.classList.add('modal-active');
      }

      // Handle Confirm button
      modal.querySelector('.confirm-btn').addEventListener('click', async () => {
        await handleReturn(button.dataset.id, button);
        document.body.removeChild(modal); // Remove modal
        if (dashboard) {
          dashboard.classList.remove('modal-active'); // Remove opacity
        }
      });

      // Handle Cancel button
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal); // Remove modal
        if (dashboard) {
          dashboard.classList.remove('modal-active'); // Remove opacity
        }
      });
    });
  });

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
          const reportRef = doc(db, "borrowList", button.dataset.id);
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
};

function attachConfirmationListeners() {
  document.querySelectorAll('.approve-btn-js, .return-btn-js').forEach(button => {
    button.addEventListener('click', () => {
      // Create the modal
      const modal = document.createElement('div');
      modal.classList.add('confirmation-modal');
      modal.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p>Are you sure you want to ${button.classList.contains('approve-btn-js') ? 'approve' : 'return'} this request?</p>
          <div class="modal-actions">
            <button class="confirm-btn">Confirm</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      // Append modal to the body
      document.body.appendChild(modal);

      // Add opacity to the dashboard
      const dashboard = document.querySelector('.dashboard');
      if (dashboard) {
        dashboard.classList.add('modal-active');
      }

      // Handle Confirm button
      modal.querySelector('.confirm-btn').addEventListener('click', async () => {
        if (button.classList.contains('approve-btn-js')) {
          await updateStatus(button.dataset.id, "Approved", button);
        } else if (button.classList.contains('return-btn-js')) {
          await handleReturn(button.dataset.id, button);
        }
        document.body.removeChild(modal); // Remove modal
        if (dashboard) {
          dashboard.classList.remove('modal-active'); // Remove opacity
        }
      });

      // Handle Cancel button
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal); // Remove modal
        if (dashboard) {
          dashboard.classList.remove('modal-active'); // Remove opacity
        }
      });
    });
  });
}

// Call this function to attach listeners
attachConfirmationListeners();

document.addEventListener("DOMContentLoaded", () => {
  setupRealtimeListener();

  const filterSelect = document.querySelector('#sortingReequest');
  const startDateInput = document.querySelector('#startDate');
  const endDateInput = document.querySelector('#endDate');

  filterSelect.addEventListener('change', () => {
    const selected = filterSelect.value;
    if (selected === "pending-sort") currentStatusFilter = "Pending";
    else if (selected === "approve-sort") currentStatusFilter = "Approved";
    else if (selected === "remove-sort") currentStatusFilter = "Removed"; // Updated from "Declined"
    else if (selected === "return-sort") currentStatusFilter = "Returned";
    else currentStatusFilter = "All";

    renderFilteredReports();
  });

  const handleDateChange = () => {
    currentStartDate = startDateInput.value ? new Date(startDateInput.value) : null;
    currentEndDate = endDateInput.value ? new Date(endDateInput.value) : null;
    if (currentEndDate) currentEndDate.setHours(23, 59, 59, 999);
    renderFilteredReports();
  };

  startDateInput.addEventListener("change", handleDateChange);
  endDateInput.addEventListener("change", handleDateChange);
});
