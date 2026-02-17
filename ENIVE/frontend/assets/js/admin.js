/**
 * Admin Dashboard JS
 * ===================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Auth guard - admin only
    if (!requireAuth(['ADMIN'])) return;

    // Load all data
    loadStats();
    loadPendingCampaigns();
    loadUsers();
    loadAuditLogs();

    // Event handlers
    initFilters();
    initModals();

    // Logout handler
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        API.logout();
    });

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', refreshAll);

    // Update timestamp
    updateLastUpdated();
});

async function loadStats() {
    try {
        const stats = await API.getAdminStats();
        
        if (stats) {
            document.getElementById('total-users').textContent = stats.total_users;
            document.getElementById('total-campaigns').textContent = stats.total_campaigns;
            document.getElementById('live-campaigns').textContent = stats.live_campaigns;
            document.getElementById('pending-campaigns').textContent = stats.pending_campaigns;
            document.getElementById('total-raised').textContent = `$${stats.total_raised.toLocaleString()}`;
            document.getElementById('total-transactions').textContent = stats.total_transactions;

            // Update pending badge in sidebar
            document.getElementById('pending-count').textContent = stats.pending_campaigns;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadPendingCampaigns() {
    const container = document.getElementById('pending-list');
    
    try {
        const data = await API.getPendingCampaigns();

        if (!data || !data.campaigns || data.campaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No campaigns pending approval</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.campaigns.map(campaign => createPendingCard(campaign)).join('');

    } catch (error) {
        console.error('Failed to load pending campaigns:', error);
    }
}

function createPendingCard(campaign) {
    return `
        <div class="pending-card" data-id="${campaign.campaign_id}">
            <div class="pending-info">
                <h4>${campaign.title}</h4>
                <p>${campaign.description?.substring(0, 150) || 'No description'}...</p>
                <div class="pending-meta">
                    <span>🌍 ${campaign.country}</span>
                    <span>💰 Target: $${campaign.target_amount.toLocaleString()}</span>
                    <span>📅 ${formatDate(campaign.created_at)}</span>
                </div>
            </div>
            <div class="pending-actions">
                <button class="btn btn-success btn-sm" onclick="approveCampaign('${campaign.campaign_id}')">
                    ✓ Approve
                </button>
                <button class="btn btn-danger btn-sm" onclick="openRejectModal('${campaign.campaign_id}')">
                    ✗ Reject
                </button>
            </div>
        </div>
    `;
}

async function loadUsers(filters = {}) {
    const tbody = document.getElementById('users-body');
    
    try {
        const users = await API.getUsers(filters);

        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">No users found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.email}</td>
                <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
                <td>${user.country}</td>
                <td>
                    <select class="kyc-select" data-user-id="${user.user_id}" onchange="updateKYC('${user.user_id}', this.value)">
                        <option value="PENDING" ${user.kyc_status === 'PENDING' ? 'selected' : ''}>Pending</option>
                        <option value="VERIFIED" ${user.kyc_status === 'VERIFIED' ? 'selected' : ''}>Verified</option>
                        <option value="REJECTED" ${user.kyc_status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <button class="btn btn-outline btn-xs">View</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function loadAuditLogs() {
    const tbody = document.getElementById('audit-body');
    
    try {
        const logs = await API.getAuditLogs({ limit: 50 });

        if (!logs || logs.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="4">No audit logs</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${formatDateTime(log.timestamp)}</td>
                <td><span class="action-badge action-${log.action.toLowerCase()}">${log.action}</span></td>
                <td>${log.user_id.substring(0, 12)}...</td>
                <td><code>${JSON.stringify(log.details).substring(0, 50)}...</code></td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Failed to load audit logs:', error);
    }
}

// Campaign Approval Actions
async function approveCampaign(campaignId) {
    if (!confirm('Are you sure you want to approve this campaign?')) return;

    try {
        await API.approveCampaign(campaignId);
        alert('Campaign approved successfully!');
        refreshAll();
    } catch (error) {
        alert('Failed to approve campaign: ' + error.message);
    }
}

let currentRejectId = null;

function openRejectModal(campaignId) {
    currentRejectId = campaignId;
    document.getElementById('rejection-modal').style.display = 'block';
}

function closeRejectModal() {
    currentRejectId = null;
    document.getElementById('rejection-modal').style.display = 'none';
    document.getElementById('rejection-reason').value = '';
}

async function submitRejection(e) {
    e.preventDefault();
    
    const reason = document.getElementById('rejection-reason').value.trim();
    
    if (!reason) {
        alert('Please provide a rejection reason');
        return;
    }

    try {
        await API.rejectCampaign(currentRejectId, reason);
        alert('Campaign rejected');
        closeRejectModal();
        refreshAll();
    } catch (error) {
        alert('Failed to reject campaign: ' + error.message);
    }
}

// KYC Update
async function updateKYC(userId, status) {
    try {
        await API.updateUserKYC(userId, status);
        // No alert, just update silently
    } catch (error) {
        alert('Failed to update KYC: ' + error.message);
        loadUsers(); // Reload to reset
    }
}

// Filter handlers
function initFilters() {
    document.getElementById('user-role-filter')?.addEventListener('change', applyUserFilters);
    document.getElementById('user-kyc-filter')?.addEventListener('change', applyUserFilters);
}

function applyUserFilters() {
    const role = document.getElementById('user-role-filter')?.value || '';
    const kyc = document.getElementById('user-kyc-filter')?.value || '';
    
    loadUsers({ role, kyc_status: kyc });
}

// Modal handlers
function initModals() {
    // Rejection modal
    document.getElementById('rejection-form')?.addEventListener('submit', submitRejection);
    document.getElementById('cancel-rejection')?.addEventListener('click', closeRejectModal);
    
    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            closeRejectModal();
        });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeRejectModal();
        });
    });
}

// Refresh all data
function refreshAll() {
    loadStats();
    loadPendingCampaigns();
    loadUsers();
    loadAuditLogs();
    updateLastUpdated();
}

function updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el) {
        el.textContent = new Date().toLocaleTimeString();
    }
}

// Utilities
function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Make functions available globally
window.approveCampaign = approveCampaign;
window.openRejectModal = openRejectModal;
window.updateKYC = updateKYC;
