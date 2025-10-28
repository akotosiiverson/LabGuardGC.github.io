// Import Firebase config
import { db, signInUser } from "./firebase-config.js";
import { 
    collection,
    getDocs, 
    query, 
    where,
    doc,
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const showPasswordToggle = document.getElementById('show-password-toggle');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const closeErrorBtn = document.getElementById('close-error');

// Handle Email/Password Login
loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Input validation
    if (!email || !password) {
        showError('Please enter both email and password.');
        return;
    }
      
    // Show loading state
    loginBtn.textContent = "Signing in...";
    loginBtn.disabled = true;
    
    try {
        console.log("Starting authentication process for:", email);
        
        // Authenticate with our custom authentication system
        const result = await signInUser(email, password);
        console.log("Authentication result:", result.success ? "Success" : "Failed");
        
        if (!result.success) {
            console.error("Login error details:", result.error);
            handleAuthError(result.error);
            return;
        }
        
        // Get user data
        const userData = result.user;
        console.log("User data received:", userData);
        
        // Store essential user info in session storage
        const userInfo = {
            uid: userData.uid, 
            email: userData.email,
            role: userData.role,
            displayName: userData.displayName || email.split('@')[0]
        };        console.log("Storing user info:", userInfo);
        sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
        
        // Successful login
        console.log("Login successful, redirecting to dashboard");
        redirectToDashboard();
    } catch (error) {
        console.error("Unexpected error during login:", error);
        handleAuthError(error);
    } finally {
        // Reset button state
        loginBtn.textContent = "Sign In";
        loginBtn.disabled = false;
    }
});

// No Google Sign-in

// Close error modal
closeErrorBtn.addEventListener('click', () => {
    errorModal.style.display = 'none';
});

// Helper Functions
function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

function handleAuthError(error) {
    console.group("Authentication Error Details");
    console.error('Error object:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Attempted login with email:', emailInput.value.trim());
    console.groupEnd();
    
    let message = 'Failed to log in. Please try again.';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
    } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again later.';
    } else if (error.name && error.name === 'FirebaseError') {
        message = `Firebase error: ${error.message}`;
        console.error('Firebase error details:', error);
    } else if (error.toString().includes('NetworkError')) {
        message = 'Network error. Please check your connection and try again.';
    }
    
    // Show technical error information in console for debugging
    console.log('Error message shown to user:', message);
    
    showError(message);
}

function redirectToDashboard() {
    // Redirect to dashboard after successful login
    window.location.href = '/structure.html';
}

// Check if user is already logged in with custom auth
document.addEventListener('DOMContentLoaded', () => {
    // Check for auth token in session storage
    const authToken = sessionStorage.getItem('auth_token');
    const storedEmail = sessionStorage.getItem('user_email');
    
    if (authToken === 'yOgRxCI9DaAbpveCxTHc' && storedEmail) {
        // User is already logged in, redirect to dashboard
        redirectToDashboard();
    }
});

// Show/Hide Password Functionality
if (showPasswordToggle) {
    showPasswordToggle.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            showPasswordToggle.classList.remove('bx-hide');
            showPasswordToggle.classList.add('bx-show');
        } else {
            passwordInput.type = 'password';
            showPasswordToggle.classList.remove('bx-show');
            showPasswordToggle.classList.add('bx-hide');
        }
    });
}

// Dark Mode Toggle Functionality is now handled in dark-mode.js
