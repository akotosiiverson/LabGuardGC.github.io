import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';
import { addReport } from './firebase-config.js';

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const auth = getAuth();
const db = getFirestore();

export function printYourrequestInfo() {
  const requestButton = document.querySelector('.js-submit-button-report');
  if (!requestButton) return; // no active popup

  // scope all element queries to the popup container to avoid global collisions
  const container = requestButton.closest('.container') || document;
  const roomNumber = container.querySelector('.room-number');
  const pcNumber = container.querySelector('.pc-number');
  const issue = container.querySelector('.issue');
  const imageInput = container.querySelector('#upload-report-image');
  const errorMessage = container.querySelector('#error-message');
  const agreementError = container.querySelector('#agreement-error') || container.querySelector('.agreement-error');
  const checkButton = container.querySelector('#report-agree-checkbox') || container.querySelector('.report-agree-checkbox');
  const statusReport = 'Pending';
  // product name comes from the button dataset placed by the dashboard template
  const productName = requestButton.dataset.productName || container.querySelector('[data-product-name]')?.dataset.productName || null;
  // current user info (may be null if not signed in)
  const currentUser = auth.currentUser || null;
  const fullName = currentUser ? (currentUser.displayName || currentUser.email || null) : null;
  const userId = currentUser ? currentUser.uid : null;

  if (requestButton) {
    requestButton.addEventListener('click', async (e) => {
      e.preventDefault();
      console.debug('Report submit clicked', { productName, userId, fullName });

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

      const imageFile = imageInput?.files?.[0] || null;
      if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        showFieldError('Image file size must be less than 5MB.');
        return;
      }

      try {
        console.debug('Calling addReport', { productName, imageFileProvided: !!imageFile });
        const docId = await addReport(
          productName,
          issue.value,
          +pcNumber.value,
          +roomNumber.value,
          statusReport,
          imageFile,   // may be null — upload skipped in firebase-config.js
          fullName,
          userId
        );
        console.info('Report added, id=', docId);

        // success: hide popup and restore UI
        const popup = requestButton.closest('.container');
        if (popup) popup.remove();
        document.querySelectorAll('.rqst-btn').forEach((btn) => btn.disabled = false);
        document.querySelector('.available-item')?.classList.remove('no-scroll');
      } catch (uploadErr) {
        console.error('Report submission failed:', uploadErr);
        showFieldError('Failed to submit report. Please try again or contact admin.');
      }
    });
  }
}
