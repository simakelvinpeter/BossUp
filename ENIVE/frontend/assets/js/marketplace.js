/**
 * Marketplace JS
 * ===============
 * Campaign listing and filtering.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Update navigation
    updateNavigation();
    
    // Load campaigns
    loadCampaigns();

    // Initialize filters
    initFilters();
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

async function loadCampaigns(filters = {}) {
    const container = document.getElementById('campaigns-grid');
    const countElement = document.getElementById('campaigns-count');

    if (!container) return;

    // Show loading
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading campaigns...</p>
        </div>
    `;

    try {
        const data = await API.getCampaigns({
            status: 'LIVE',
            ...filters
        });

        if (!data || !data.campaigns || data.campaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No campaigns found</h3>
                    <p>Try adjusting your filters or check back later.</p>
                </div>
            `;
            if (countElement) countElement.textContent = '0 campaigns';
            return;
        }

        container.innerHTML = data.campaigns.map(campaign => createCampaignCard(campaign)).join('');
        
        if (countElement) {
            countElement.textContent = `${data.campaigns.length} campaign${data.campaigns.length !== 1 ? 's' : ''} found`;
        }
    } catch (error) {
        console.error('Failed to load campaigns:', error);
        container.innerHTML = `
            <div class="error-state">
                <h3>Failed to load campaigns</h3>
                <p>Please try again later.</p>
                <button class="btn btn-primary" onclick="loadCampaigns()">Retry</button>
            </div>
        `;
    }
}

function initFilters() {
    const countryFilter = document.getElementById('filter-country');
    const categoryFilter = document.getElementById('filter-category');
    const sortFilter = document.getElementById('filter-sort');
    const clearBtn = document.getElementById('clear-filters');

    // Apply filters on change
    [countryFilter, categoryFilter, sortFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });

    // Clear filters
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (countryFilter) countryFilter.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (sortFilter) sortFilter.value = 'newest';
            loadCampaigns();
        });
    }
}

function applyFilters() {
    const country = document.getElementById('filter-country')?.value || '';
    const category = document.getElementById('filter-category')?.value || '';
    const sort = document.getElementById('filter-sort')?.value || 'newest';

    const filters = {};
    if (country) filters.country = country;
    // Note: category and sort would need backend support

    loadCampaigns(filters);
}

// Campaign card (reuse from main.js or define here)
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

// Utilities (if not available from main.js)
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
