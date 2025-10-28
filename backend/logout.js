/**
 * Logout Module
 * 
 * Handles user logout functionality with confirmation modal
 * Uses our custom authentication system (not Firebase Auth)
 */

// Function to determine if we're on mobile
const isMobileView = () => window.innerWidth <= 576;

const logoutBtns = document.querySelectorAll('.logout-button');
logoutBtns.forEach(logoutBtn => {
  logoutBtn.addEventListener('click', () => {
    // Prevent duplicate modals
    if (document.querySelector('.logout-modal')) return;
  
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.classList.add('logout-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'logout-title');
    modal.setAttribute('aria-describedby', 'logout-description');
    
    // Check if we're on mobile to adjust the layout
    const isMobile = isMobileView();
    
    modal.innerHTML = `
      <div class="logout-icon-container">
      <img 
  src="../asset/icons/qmark-icon.png" 
  onerror="this.onerror=null; this.src='asset/icons/qmark-icon.png';" 
  alt="Qmark icon">
      </div>
      <p class="confirm-text" id="logout-title">CONFIRM LOGOUT</p>
      <p class="confirmation-text" id="logout-description">Are you sure you want to exit the application?</p>
      <div class="confirm-button-container">
        <button class="confirmed-btn">${isMobile ? 'Yes' : 'Yes, Log me out!'}</button>
        <button class="declined-btn">Cancel</button>
      </div>
    `;
    document.body.appendChild(modal);
  
    // Cancel button closes modal
    modal.querySelector('.declined-btn').addEventListener('click', () => {
      modal.remove();
      overlay.remove();
    });
    
    // Confirm button performs logout
    modal.querySelector('.confirmed-btn').addEventListener('click', () => {
      // Display logout animation
      const loadingOverlay = document.createElement('div');
      loadingOverlay.classList.add('loading-overlay');
      loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Logging out...</p>
      `;
      
      document.body.appendChild(loadingOverlay);
      
      // Short delay for user experience
      setTimeout(() => {
        console.log("User logged out successfully");

        // Redirect logic (change this condition if needed)
        if (isMobile) {
          window.location.href = 'index.html';  
        } else {
          window.location.href = '/Computer-Lab-Smart-Maintenance-System/index.html';
        }
      }, 500);
    });
    
    // Close modal when clicking outside (but not for small screens)
    if (!isMobile) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          modal.remove();
          overlay.remove();
        }
      });
    }
    
    // Handle Escape key to close modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && document.querySelector('.logout-modal')) {
        modal.remove();
        overlay.remove();
      }
    });
    
    // Add focus trap for keyboard navigation
    const focusableElements = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Set initial focus on the first button
    setTimeout(() => {
      firstElement.focus();
    }, 100);
    
    // Create focus trap
    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        // Shift + Tab
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        // Tab
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  });
});
