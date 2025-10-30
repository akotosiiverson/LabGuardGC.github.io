import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';
import { addReport } from './firebase-config.js';

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const auth = getAuth();
const db = getFirestore();

export function printYourrequestInfo() {
  const requestButton = document.querySelector('.js-submit-button-report');
  const roomNumber = document.querySelector('.room-number');
  const pcNumber = document.querySelector('.pc-number');
  const issue = document.querySelector('.issue');
  const imageInput = document.querySelector('#upload-report-image');
  const errorMessage = document.querySelector('#error-message');
  const agreementError = document.querySelector('#agreement-error');
  const checkButton = document.querySelector('.report-agree-checkbox');
  const statusReport = 'Pending';

  if (requestButton) {
    requestButton.addEventListener('click', async (e) => {
      e.preventDefault();
      // Validate form fields and show all applicable errors (don't return early)
      let hasError = false;

      function showFieldError(msg) {
        if (!errorMessage) return;
        const span = errorMessage.querySelector('span');
        if (span) span.textContent = msg;
        errorMessage.style.display = 'block';
        errorMessage.classList.add('show');
        setTimeout(() => {
          errorMessage.classList.remove('show');
          errorMessage.style.display = 'none';
        }, 3000);
      }

      function showAgreementError(msg) {
        if (!agreementError) return;
        const span = agreementError.querySelector('span');
        if (span) span.textContent = msg;
        agreementError.style.display = 'block';
        agreementError.classList.add('show');
        setTimeout(() => {
          agreementError.classList.remove('show');
          agreementError.style.display = 'none';
        }, 3000);
      }

      if (!roomNumber.value || !pcNumber.value || !issue.value) {
        showFieldError('Please complete all required fields.');
        hasError = true;
      }

      if (!checkButton || !checkButton.checked) {
        showAgreementError("Please acknowledge and accept Gordon College's Terms and Policies before proceeding");
        console.log('Agreement not checked or checkbox missing');
        hasError = true;
      }

      if (hasError) return;

      // Validate file size (5MB limit)
      const imageFile = imageInput.files[0];
      if (imageFile && imageFile.size > 5 * 1024 * 1024) { // 5MB in bytes
        errorMessage.classList.add('show');
        errorMessage.querySelector('span').textContent = 'Image file size must be less than 5MB.';
        
        // Hide error message after 3 seconds
        setTimeout(() => {
          errorMessage.classList.remove('show');
        }, 3000);
        return;
      }

      if (roomNumber.value && pcNumber.value && issue.value) {
        const productName = requestButton.dataset.productName;

        // Get current user displayName and uid asynchronously
            const { fullName, userId } = await new Promise((resolve, reject) => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); // ✅ prevent multiple calls
        
            if (!user) {
              alert("You must be logged in to submit a borrow request.");
              return reject("User not logged in");
            }
        
            try {
              const userDocRef = doc(db, "users", user.uid);
              const userDocSnap = await getDoc(userDocRef);
        
              const fullNameFromFirestore = userDocSnap.exists() ? userDocSnap.data().fullName : null;
              const nameToUse = fullNameFromFirestore || user.displayName || "Anonymous";
        
              resolve({
                fullName: nameToUse,
                userId: user.uid,
              });
            } catch (error) {
              console.error("Error fetching user doc:", error);
              reject("Error fetching user doc");
            }
          });
        });
        console.log(`User: ${fullName}, ID: ${userId}`);
        // Call addReport with all info including fullName and userId
        await addReport(
          productName,
          issue.value,
          +pcNumber.value,
          +roomNumber.value,
          statusReport,
          imageFile || null,
          fullName ,
          userId // <-- added userId here
        );

        // Hide modal after successful submission
        document.querySelector('.container').style.display = 'none';

        // Re-enable report buttons
        document.querySelectorAll('.rqst-btn').forEach((btn) => {
          btn.disabled = false;
        });
        document.querySelector('.available-item').classList.remove('no-scroll');

        console.log(`Report submitted by ${fullName} on ${dayjs().format('MMMM D, YYYY')}`);

      } else {
        console.warn('Please fill in all fields before submitting.');
      }
    });
  }

  // Close button logic
  const closeButton = document.querySelector('.close-button');
  const container = document.querySelector('.container');
  if (closeButton && container) {
    closeButton.addEventListener('click', () => {
      container.style.display = 'none';

      // Re-enable report buttons on close
      document.querySelectorAll('.rqst-btn').forEach((btn) => {
        btn.disabled = false;
      });
      document.querySelector('.available-item').classList.remove('no-scroll');
    });
  }
}
