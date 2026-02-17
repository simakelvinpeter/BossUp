/**
 * Business Dashboard JS
 * ======================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Auth guard - business owners only
    if (!requireAuth(['BUSINESS_OWNER'])) return;

    // Load user data
    loadUserProfile();

    // Load campaigns
    loadMyCampaigns();

    // Modal handlers
    initCampaignModal();

    // Logout handler
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        API.logout();
    });
});

async function loadUserProfile() {
    try {
        const user = await API.getCurrentUser();
        
        if (user) {
            document.getElementById('user-name').textContent = user.full_name || user.email;
            
            const kycBadge = document.getElementById('kyc-badge');
            if (kycBadge) {
                kycBadge.textContent = `KYC: ${user.kyc_status}`;
                kycBadge.className = `kyc-badge kyc-${user.kyc_status.toLowerCase()}`;
            }
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

async function loadMyCampaigns() {
    const container = document.getElementById('campaigns-list');
    
    try {
        const data = await API.getMyCampaigns();

        if (!data || !data.campaigns || data.campaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>You haven't created any campaigns yet.</p>
                    <button class="btn btn-primary" onclick="openCampaignModal()">Create Your First Campaign</button>
                </div>
            `;
            // Update stats
            updateStats(0, 0, 0, 0);
            return;
        }

        // Calculate stats
        let totalRaised = 0;
        let activeCampaigns = 0;
        let pendingCampaigns = 0;

        data.campaigns.forEach(c => {
            totalRaised += c.raised_amount || 0;
            if (c.status === 'LIVE') activeCampaigns++;
            if (c.status === 'PENDING') pendingCampaigns++;
        });

        updateStats(totalRaised, activeCampaigns, 0, pendingCampaigns);

        // Render campaigns
        container.innerHTML = data.campaigns.map(campaign => createCampaignRow(campaign)).join('');

    } catch (error) {
        console.error('Failed to load campaigns:', error);
        container.innerHTML = `
            <div class="error-state">
                <p>Failed to load campaigns.</p>
                <button class="btn btn-outline" onclick="loadMyCampaigns()">Retry</button>
            </div>
        `;
    }
}

function updateStats(totalRaised, active, investors, pending) {
    document.getElementById('total-raised').textContent = `$${totalRaised.toLocaleString()}`;
    document.getElementById('active-campaigns').textContent = active;
    document.getElementById('total-investors').textContent = investors;
    document.getElementById('pending-campaigns').textContent = pending;
}

function createCampaignRow(campaign) {
    const progress = campaign.target_amount > 0 
        ? Math.round((campaign.raised_amount / campaign.target_amount) * 100) 
        : 0;

    const statusClass = {
        'PENDING': 'warning',
        'LIVE': 'success',
        'REJECTED': 'danger',
        'COMPLETED': 'info'
    };

    return `
        <div class="campaign-row">
            <div class="campaign-info">
                <h4>${campaign.title}</h4>
                <span class="campaign-country">${campaign.country}</span>
            </div>
            <div class="campaign-progress-mini">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <span class="progress-text">$${campaign.raised_amount.toLocaleString()} / $${campaign.target_amount.toLocaleString()}</span>
            </div>
            <div class="campaign-status">
                <span class="status-badge status-${statusClass[campaign.status] || 'default'}">${campaign.status}</span>
            </div>
            <div class="campaign-actions">
                <a href="campaign.html?id=${campaign.campaign_id}" class="btn btn-outline btn-sm">View</a>
                ${campaign.status === 'PENDING' ? `<button class="btn btn-outline btn-sm" onclick="editCampaign('${campaign.campaign_id}')">Edit</button>` : ''}
            </div>
        </div>
    `;
}

function initCampaignModal() {
    const modal = document.getElementById('create-campaign-modal');
    const form = document.getElementById('campaign-form');
    
    // Open modal buttons
    document.getElementById('create-campaign-btn')?.addEventListener('click', openCampaignModal);
    document.getElementById('create-first-campaign')?.addEventListener('click', openCampaignModal);

    // Close modal
    document.getElementById('modal-close')?.addEventListener('click', closeCampaignModal);
    document.getElementById('cancel-campaign')?.addEventListener('click', closeCampaignModal);
    
    modal?.querySelector('.modal-overlay')?.addEventListener('click', closeCampaignModal);

    // Form submission
    form?.addEventListener('submit', handleCampaignSubmit);
}

function openCampaignModal() {
    const modal = document.getElementById('create-campaign-modal');
    if (modal) modal.style.display = 'block';
}

function closeCampaignModal() {
    const modal = document.getElementById('create-campaign-modal');
    const form = document.getElementById('campaign-form');
    
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    
    // Clear error
    const errorDiv = document.getElementById('campaign-error');
    if (errorDiv) errorDiv.style.display = 'none';
}

async function handleCampaignSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const errorDiv = document.getElementById('campaign-error');

    const data = {
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        target_amount: parseFloat(form.target_amount.value),
        country: form.country.value,
        category: form.category.value || null
    };

    // Validation
    if (data.target_amount < 1000) {
        showError(errorDiv, 'Minimum funding target is $1,000');
        return;
    }

    try {
        const campaign = await API.createCampaign(data);
        
        if (campaign) {
            closeCampaignModal();
            loadMyCampaigns();
            alert('Campaign created successfully! It will be reviewed by our team.');
        }
    } catch (error) {
        showError(errorDiv, error.message || 'Failed to create campaign');
    }
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

// Make openCampaignModal available globally
window.openCampaignModal = openCampaignModal;
