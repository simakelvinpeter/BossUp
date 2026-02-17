/**
 * Main JS
 * ========
 * Homepage and general functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Update navigation based on auth state
    updateNavigation();

    // Load featured campaigns on homepage
    if (document.getElementById('featured-campaigns')) {
        loadFeaturedCampaigns();
    }

    // Mobile menu toggle
    initMobileMenu();
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

async function loadFeaturedCampaigns() {
    const container = document.getElementById('featured-campaigns');
    if (!container) return;

    try {
        const data = await API.getCampaigns({ status: 'LIVE', limit: 6 });
        
        if (!data || !data.campaigns || data.campaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No campaigns available yet. Be the first to invest!</p>
                    <a href="signup.html?role=business" class="btn btn-primary">List Your Business</a>
                </div>
            `;
            return;
        }

        container.innerHTML = data.campaigns.map(campaign => createCampaignCard(campaign)).join('');
    } catch (error) {
        console.error('Failed to load campaigns:', error);
        container.innerHTML = `
            <div class="error-state">
                <p>Failed to load campaigns. Please try again later.</p>
            </div>
        `;
    }
}

function createCampaignCard(campaign) {
    const progress = campaign.target_amount > 0 
        ? Math.round((campaign.raised_amount / campaign.target_amount) * 100) 
        : 0;
    
    const countryFlags = {
        'NG': '🇳🇬',
        'KE': '🇰🇪',
        'ZA': '🇿🇦',
        'GH': '🇬🇭',
        'TZ': '🇹🇿',
        'EG': '🇪🇬'
    };

    return `
        <div class="campaign-card">
            <div class="campaign-image">
                <img src="${campaign.image_url || 'assets/images/campaign-placeholder.jpg'}" alt="${campaign.title}">
                <span class="campaign-badge">${campaign.status}</span>
            </div>
            <div class="campaign-info">
                <div class="campaign-meta">
                    <span class="country">${countryFlags[campaign.country] || '🌍'} ${campaign.country}</span>
                    ${campaign.category ? `<span class="category">${campaign.category}</span>` : ''}
                </div>
                <h3 class="campaign-title">${campaign.title}</h3>
                <p class="campaign-description">${truncateText(campaign.description, 100)}</p>
                <div class="campaign-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="progress-info">
                        <span class="raised">$${formatNumber(campaign.raised_amount)}</span>
                        <span class="target">of $${formatNumber(campaign.target_amount)}</span>
                    </div>
                </div>
                <a href="campaign.html?id=${campaign.campaign_id}" class="btn btn-primary btn-block">View Details</a>
            </div>
        </div>
    `;
}

function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });
    }
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Export utilities
window.formatNumber = formatNumber;
window.truncateText = truncateText;
window.formatDate = formatDate;
window.createCampaignCard = createCampaignCard;
