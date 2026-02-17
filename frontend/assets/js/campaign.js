/**
 * Campaign Detail JS
 * ===================
 * Single campaign view and investment.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get campaign ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('id');

    if (!campaignId) {
        showError();
        return;
    }

    // Load campaign
    loadCampaign(campaignId);

    // Update navigation
    updateNavigation();
});

async function updateNavigation() {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    if (TokenManager.isAuthenticated()) {
        const userData = TokenManager.getUserData();
        
        let dashboardUrl = '/investor-dashboard.html';
        if (userData?.role === 'BUSINESS_OWNER') {
            dashboardUrl = '/business-dashboard.html';
        } else if (userData?.role === 'ADMIN') {
            dashboardUrl = '/admin.html';
        }

        navAuth.innerHTML = `
            <a href="${dashboardUrl}" class="btn btn-outline">Dashboard</a>
            <button class="btn btn-primary" onclick="API.logout()">Logout</button>
        `;
    }
}

async function loadCampaign(campaignId) {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const contentState = document.getElementById('campaign-content');

    try {
        const campaign = await API.getCampaign(campaignId);

        if (!campaign) {
            showError();
            return;
        }

        // Hide loading, show content
        loadingState.style.display = 'none';
        contentState.style.display = 'block';

        // Populate content
        populateCampaign(campaign);

        // Setup investment form if user is investor
        setupInvestmentForm(campaignId);

    } catch (error) {
        console.error('Failed to load campaign:', error);
        showError();
    }
}

function populateCampaign(campaign) {
    // Update page title
    document.title = `${campaign.title} - BossUp`;

    // Status badge
    const statusBadge = document.getElementById('campaign-status');
    if (statusBadge) {
        statusBadge.textContent = campaign.status;
        statusBadge.className = `campaign-status status-${campaign.status.toLowerCase()}`;
    }

    // Basic info
    setText('campaign-title', campaign.title);
    setText('campaign-description', campaign.description);
    setText('campaign-country', getCountryName(campaign.country));
    setText('campaign-category', campaign.category || 'General');

    // Image
    const img = document.getElementById('campaign-image');
    if (img && campaign.image_url) {
        img.src = campaign.image_url;
    }

    // Funding progress
    const progress = campaign.target_amount > 0 
        ? Math.round((campaign.raised_amount / campaign.target_amount) * 100) 
        : 0;

    setText('raised-amount', formatNumber(campaign.raised_amount));
    setText('target-amount', formatNumber(campaign.target_amount));
    setText('progress-percent', Math.min(progress, 100));

    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${Math.min(progress, 100)}%`;
    }

    // Documents (if any)
    const docsList = document.getElementById('documents-list');
    if (docsList && campaign.business_plan_url) {
        docsList.innerHTML = `
            <a href="${campaign.business_plan_url}" target="_blank" class="document-link">
                📄 Business Plan
            </a>
        `;
    }
}

function setupInvestmentForm(campaignId) {
    const investmentForm = document.getElementById('investment-form');
    const loginPrompt = document.getElementById('login-prompt');
    const form = document.getElementById('invest-form');

    // Check if user is authenticated investor
    if (TokenManager.isAuthenticated()) {
        const userData = TokenManager.getUserData();
        
        if (userData?.role === 'INVESTOR') {
            // Show investment form
            if (investmentForm) investmentForm.style.display = 'block';
            if (loginPrompt) loginPrompt.style.display = 'none';

            // Handle form submission
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const amount = parseFloat(document.getElementById('invest-amount').value);
                    
                    if (amount < 100) {
                        alert('Minimum investment is $100');
                        return;
                    }

                    try {
                        const session = await API.initiatePayment(campaignId, amount);
                        
                        if (session && session.checkout_url) {
                            // Redirect to payment page
                            window.location.href = session.checkout_url;
                        }
                    } catch (error) {
                        alert('Failed to initiate payment: ' + error.message);
                    }
                });
            }
        } else {
            // Not an investor
            if (investmentForm) investmentForm.style.display = 'none';
            if (loginPrompt) {
                loginPrompt.innerHTML = `
                    <p>Only investors can invest in campaigns.</p>
                    <a href="${userData?.role === 'BUSINESS_OWNER' ? 'business-dashboard.html' : 'admin.html'}" class="btn btn-primary btn-block">Go to Dashboard</a>
                `;
            }
        }
    } else {
        // Not authenticated
        if (investmentForm) investmentForm.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
    }
}

function showError() {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'block';
}

// Utilities
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatNumber(num) {
    return num.toLocaleString();
}

function getCountryName(code) {
    const countries = {
        'NG': 'Nigeria',
        'KE': 'Kenya',
        'ZA': 'South Africa',
        'GH': 'Ghana',
        'TZ': 'Tanzania',
        'EG': 'Egypt'
    };
    return countries[code] || code;
}
