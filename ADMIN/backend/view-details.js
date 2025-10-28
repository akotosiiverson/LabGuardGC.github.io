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
export function initializeViewDetailsFeature() {
    // Check if the modal exists; if not, create it
    let modal = document.querySelector('.details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.classList.add('details-modal');
        document.body.appendChild(modal);
    }

    // Set the modal's innerHTML
    modal.innerHTML = `
        <div class="details-modal-content">
            <div class="details-modal-header">
                <h3 class="details-modal-title">Repair Details</h3>
                <button class="details-modal-close">&times;</button>
            </div>
            <div class="details-modal-body">
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">Repaired</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">May 19, 2025</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Approved Date:</span>
                    <span class="detail-value">N/A</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Issue:</span>
                    <span class="detail-value">No details provided</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Equipment:</span>
                    <span class="detail-value">Unknown</span>
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
            </div>
        </div>
    `;

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
            //showDetailsModal(this);
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
function hideModal() {
    const modal = document.querySelector('.details-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}
/**
 * Creates the modal dialog for repair details


function createModal() {
    const modalHTML = `
    
    `
}
 */


/**
 * Displays the modal with repair details
 * @param {HTMLElement} detailsLink - The clicked View Details link
 */
/**
function showDetailsModal(detailsLink) {
    const modal = document.querySelector('.details-modal');
    const modalBody = modal.querySelector('.details-modal-body');
    
    // Extract data from the history item
    const historyItem = detailsLink.closest('.history-item');
    const status = historyItem.querySelector('.status-tag').textContent;
    const date = historyItem.querySelector('.date').textContent;
    const approvedDate = historyItem.dataset.approvedDate || 'N/A'; // Example of extracting approvedDate
    const issue = historyItem.dataset.issue || 'No details provided'; // Example of extracting issue
    const equipment = historyItem.dataset.equipment || 'Unknown'; // Example of extracting equipment
    
    // Generate repair details HTML
    const repairDetails = generateRepairDetailsHTML(status, date);
    
    // Update and show the modal
    modalBody.innerHTML = repairDetails;
    modal.classList.add('active');
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}
*/
/**
 * Generates the HTML for repair details
 * @param {string} status - The repair status text
 * @param {string} date - The repair date
 * @param {string} approvedDate - The approved date
 * @param {string} issue - The issue description
 * @param {string} equipment - The equipment involved
 * @returns {string} HTML for the modal body
 */
/**
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
            <span class="detail-label">Approved Date:</span>
            <span class="detail-value">${approvedDate || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Issue:</span>
            <span class="detail-value">${issue || 'No details provided'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Equipment:</span>
            <span class="detail-value">${equipment || 'Unknown'}</span>
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
*/
/**
 * Hides the modal and restores background scrolling
 */
