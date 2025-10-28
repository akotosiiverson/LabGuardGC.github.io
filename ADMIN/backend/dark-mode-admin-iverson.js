/**
 * Dark Mode Toggle Functionality
 * This script handles the theme toggle feature for the LabGuard application
 */
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (!themeToggle) {
        console.warn('Theme toggle element not found');
        return;
    }
    
    // Set the initial state of the theme toggle based on saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Listen for toggle changes
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            // Switch to dark mode
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            console.log('Dark mode enabled');
        } else {
            // Switch to light mode
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            console.log('Light mode enabled');
        }
    });
    
    console.log('Theme toggle initialized. Current theme:', savedTheme || 'light');
});