/**
 * BossUp EA - Main JavaScript Application
 * Handles Firebase auth, API calls, and UI interactions
 */

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Firebase Configuration (to be filled in)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// State Management
const state = {
    user: null,
    token: null,
    isLoading: false
};

// ============================================
// Authentication Functions
// ============================================

/**
 * Initialize Firebase (when SDK is loaded)
 */
async function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        
        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                const idToken = await user.getIdToken();
                await exchangeTokenWithBackend(idToken);
            } else {
                // User is signed out
                state.user = null;
                state.token = null;
                updateUIForLoggedOutUser();
            }
        });
    }
}

/**
 * Exchange Firebase token with backend for custom JWT
 */
async function exchangeTokenWithBackend(firebaseIdToken) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${firebaseIdToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            state.token = data.access_token;
            state.user = data.user;
            localStorage.setItem('bossup_token', state.token);
            updateUIForLoggedInUser();
        } else {
            throw new Error('Failed to authenticate with backend');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showNotification('Authentication failed. Please try again.', 'error');
    }
}

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
    try {
        state.isLoading = true;
        showLoadingState();
        
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Sign in error:', error);
        showNotification(getAuthErrorMessage(error.code), 'error');
        throw error;
    } finally {
        state.isLoading = false;
        hideLoadingState();
    }
}

/**
 * Sign up with email and password
 */
async function signUp(email, password, userData) {
    try {
        state.isLoading = true;
        showLoadingState();
        
        // Create Firebase user
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const firebaseIdToken = await userCredential.user.getIdToken();
        
        // Register with backend
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${firebaseIdToken}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Failed to register with backend');
        }

        return userCredential.user;
    } catch (error) {
        console.error('Sign up error:', error);
        showNotification(getAuthErrorMessage(error.code), 'error');
        throw error;
    } finally {
        state.isLoading = false;
        hideLoadingState();
    }
}

/**
 * Sign out
 */
async function signOut() {
    try {
        await firebase.auth().signOut();
        state.user = null;
        state.token = null;
        localStorage.removeItem('bossup_token');
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

/**
 * Get auth error message
 */
function getAuthErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    return messages[errorCode] || 'An error occurred. Please try again.';
}

// ============================================
// API Functions
// ============================================

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = state.token || localStorage.getItem('bossup_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (response.status === 401) {
        // Token expired, redirect to login
        signOut();
        return null;
    }

    return response;
}

/**
 * Get campaigns list
 */
async function getCampaigns(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await apiRequest(`/campaigns?${params}`);
    if (response && response.ok) {
        return await response.json();
    }
    return [];
}

/**
 * Get single campaign
 */
async function getCampaign(campaignId) {
    const response = await apiRequest(`/campaigns/${campaignId}`);
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

/**
 * Create investment
 */
async function createInvestment(campaignId, amount) {
    const response = await apiRequest(`/campaigns/${campaignId}/invest`, {
        method: 'POST',
        body: JSON.stringify({ amount })
    });
    
    if (response && response.ok) {
        showNotification('Investment created successfully!', 'success');
        return await response.json();
    } else {
        const error = await response?.json();
        showNotification(error?.detail || 'Investment failed', 'error');
        return null;
    }
}

/**
 * Get user portfolio
 */
async function getPortfolio() {
    const response = await apiRequest('/users/me/portfolio');
    if (response && response.ok) {
        return await response.json();
    }
    return null;
}

// ============================================
// UI Functions
// ============================================

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;

    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 8px;
                background: white;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-success { border-left: 4px solid #22c55e; }
            .notification-error { border-left: 4px solid #ef4444; }
            .notification-info { border-left: 4px solid #3b82f6; }
            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #6b7280;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => notification.remove(), 5000);
}

/**
 * Show loading state
 */
function showLoadingState() {
    document.body.classList.add('loading');
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    document.body.classList.remove('loading');
}

/**
 * Update UI for logged in user
 */
function updateUIForLoggedInUser() {
    const navActions = document.querySelector('.nav-actions');
    if (navActions && state.user) {
        navActions.innerHTML = `
            <a href="${getDashboardUrl()}" class="btn btn-outline">Dashboard</a>
            <button onclick="signOut()" class="btn btn-primary">Sign Out</button>
        `;
    }
}

/**
 * Update UI for logged out user
 */
function updateUIForLoggedOutUser() {
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        navActions.innerHTML = `
            <a href="#" class="btn btn-outline" onclick="showSignInModal()">Sign In</a>
            <a href="#" class="btn btn-primary" onclick="showSignUpModal()">Get Started</a>
        `;
    }
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardUrl() {
    if (!state.user) return '/index.html';
    
    switch (state.user.role) {
        case 'ADMIN':
            return '/admin.html';
        case 'BUSINESS_OWNER':
            return '/business-dashboard.html';
        case 'INVESTOR':
        default:
            return '/investor-dashboard.html';
    }
}

// ============================================
// Form Handlers
// ============================================

/**
 * Handle investment form submission
 */
function initInvestmentForm() {
    const form = document.querySelector('#investment-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const campaignId = form.dataset.campaignId;
        const amount = parseFloat(form.querySelector('[name="amount"]').value);
        
        if (!state.user) {
            showNotification('Please sign in to invest', 'info');
            return;
        }

        await createInvestment(campaignId, amount);
    });
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'KES') {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format number with K/M suffix
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Calculate time remaining
 */
function timeRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} days left`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hours left`;
}

// ============================================
// Mobile Menu
// ============================================

function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase if available
    if (typeof firebase !== 'undefined') {
        initializeFirebase();
    }
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize investment form
    initInvestmentForm();
    
    // Check for stored token
    const storedToken = localStorage.getItem('bossup_token');
    if (storedToken) {
        state.token = storedToken;
        // Validate token with backend
        apiRequest('/users/me').then(response => {
            if (response && response.ok) {
                response.json().then(user => {
                    state.user = user;
                    updateUIForLoggedInUser();
                });
            }
        });
    }
});

// Export for use in other scripts
window.BossUp = {
    state,
    signIn,
    signUp,
    signOut,
    getCampaigns,
    getCampaign,
    createInvestment,
    getPortfolio,
    formatCurrency,
    formatNumber,
    showNotification
};
