import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';
import { addBorrow } from './firebase-config-admin-iverson.js';
export function printYourrequestInfo() {
  // ⬇️ Freshly select fields again when called
  const requestButton = document.querySelector('.submit-button-request');
  const fullName = document.querySelector('.full-name');
  const borrowedDate = document.querySelector('.borrowed-date');
  const returnDate = document.querySelector('.return-date');
  const facultyPosition = document.querySelector('.faculty-position');
  const purpose = document.querySelector('.purpose');

  if (requestButton) {
    requestButton.addEventListener('click', (e) => {
      e.preventDefault(); // prevent form submission

      // Check if borrowedDate is after returnDate
      if (dayjs(borrowedDate.value).isAfter(dayjs(returnDate.value))) {
        console.log('Borrowed date cannot be after the return date!');
        return;
      }

      // Check if borrowedDate is before today (i.e., in the past)
      if (dayjs(borrowedDate.value).isBefore(dayjs(), 'day')) {
        console.log('Borrowed date cannot be in the past!');
        return;
      }

      console.log('Full Name:', fullName.value);
      console.log('Borrowed Date:', borrowedDate.value);
      console.log('Return Date:', returnDate.value);
      console.log('Faculty Position:', facultyPosition.value);
      console.log('Purpose:', purpose.value);

      addBorrow(
        
      );
    });
  }
}
  if (document.querySelector('.close-button') && document.querySelector('.container')) {
    closeButton.addEventListener('click', () => {
      container.style.display = 'none'; // hides the modal
    });
  }
