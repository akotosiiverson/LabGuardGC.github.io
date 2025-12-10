/**
 * View Details Functionality for Repair History
 * This JavaScript file handles the click events and modal display for
 * the View Details links in the repair history section.
 */

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeViewDetailsFeature);

/**
 * Sets up all event listeners and creates the modal if needed
 */
function initializeViewDetailsFeature() {
    // Create modal if it doesn't exist yet
    if (!document.querySelector('.details-modal')) {
        createModal();
    }
    
    // Set up click handlers for all view details links
    setupViewDetailsLinks();
    
    // Set up modal close handlers
    setupModalCloseHandlers();
}

/**
 * Adds click event listeners to all view details links
 */
function setupViewDetailsLinks() {
    const viewDetailsLinks = document.querySelectorAll('.view-details');
    
    viewDetailsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showDetailsModal(this);
        });
    });
}

/**
 * Sets up all the ways to close the modal (X button, outside click, escape key)
 */
function setupModalCloseHandlers() {
    const modal = document.querySelector('.details-modal');
    const closeBtn = document.querySelector('.details-modal-close');
    
    if (modal && closeBtn) {
        // Close on X button click
        closeBtn.addEventListener('click', hideModal);
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                hideModal();
            }
        });
    }
}

/**
 * Creates the modal dialog for repair details
 */
function createModal() {
    const modalHTML = `
        <div class="details-modal">
            <div class="details-modal-content">
                <div class="details-modal-header">
                    <h3 class="details-modal-title">Repair Details</h3>
                    <button class="details-modal-close">&times;</button>
                </div>
                <div class="details-modal-body">
                    <!-- Details will be populated dynamically -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Displays the modal with repair details
 * @param {HTMLElement} detailsLink - The clicked View Details link
 */
function showDetailsModal(detailsLink) {
    const modal = document.querySelector('.details-modal');
    const modalBody = modal.querySelector('.details-modal-body');
    
    // Extract data from the history item
    const historyItem = detailsLink.closest('.history-item');
    const status = historyItem.querySelector('.status-tag').textContent;
    const date = historyItem.querySelector('.date').textContent;
    
    // Generate repair details HTML (sample data for demo)
    const repairDetails = generateRepairDetailsHTML(status, date);
    
    // Update and show the modal
    modalBody.innerHTML = repairDetails;
    modal.classList.add('active');
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

/**
 * Generates the HTML for repair details
 * @param {string} status - The repair status text
 * @param {string} date - The repair date
 * @returns {string} HTML for the modal body
 */
function generateRepairDetailsHTML(status, date) {
    return `
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${status}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Technician:</span>
            <span class="detail-value">John Smith</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Components Replaced:</span>
            <span class="detail-value">Power Supply, RAM Module</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Notes:</span>
            <span class="detail-value">Computer was not booting due to faulty power supply. 
            Replaced with new CORSAIR CV550. Also found and replaced a malfunctioning RAM module 
            during testing. All components functioning normally after repair.</span>
        </div>
    `;
}

/**
 * Hides the modal and restores background scrolling
 */
function hideModal() {
    const modal = document.querySelector('.details-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}
