import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';
import { addReport } from '../backend/firebase-config-admin-iverson.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // ✅ addDoc & collection must be imported



import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
//import {addReport} from './data/firebase.js'; //

export function printYourrequestInfo() {
  const requestButton = document.querySelector('.js-submit-button-report');
  const roomNumber = document.querySelector('.room-number');
  const pcNumber = document.querySelector('.pc-number');
  const issue = document.querySelector('.issue');
  const image =document.querySelector('.report-image')
  const uploadReportImage =document.querySelector('.upload-report-image')
  
  if (requestButton) {
    requestButton.addEventListener('click',async (e) => {
      e.preventDefault();
      
      if (
        roomNumber.value &&
        pcNumber.value &&
        issue.value
      ) {
        const productName = requestButton.dataset.productName;
        
        
        
        console.log('Room Number:', roomNumber.value);
        console.log('PC Number:', pcNumber.value);
        console.log('Issue:', issue.value);
        console.log('Product Name:', productName);
        console.log('Submitted on:', dayjs().format('MMMM D, YYYY'));
        console.log('img:',image.dataset.reportImage);
        addReport(productName,issue.value,+pcNumber.value,+roomNumber.value,dayjs().format('MMM D, YYYY'));

        
        
        
        // Hide modal after successful submission
        document.querySelector('.container').style.display = 'none';
        
        // ✅ Re-enable report buttons
        document.querySelectorAll('.rqst-btn').forEach((btn) => {
          btn.disabled = false;
        });
        document.querySelector('.available-item').classList.remove('no-scroll');
        
      } else {
        console.warn('Please fill in all fields before submitting.');
      }
    });
  }
  
  const closeButton = document.querySelector('.close-button');
  const container = document.querySelector('.container');
  if (closeButton && container) {
    closeButton.addEventListener('click', () => {
      container.style.display = 'none';
      
      // ✅ Also re-enable report buttons on close
      document.querySelectorAll('.rqst-btn').forEach((btn) => {
        btn.disabled = false;
      });
      document.querySelector('.available-item').classList.remove('no-scroll');
    });
  }}
