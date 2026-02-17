/**
 * Investor Dashboard JS
 * ======================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Auth guard - investors only
    if (!requireAuth(['INVESTOR'])) return;

    // Load user data
    loadUserProfile();

    // Load portfolio & transactions
    loadPortfolio();
    loadTransactions();

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

async function loadPortfolio() {
    const container = document.getElementById('portfolio-grid');
    
    try {
        const transactions = await API.getMyTransactions();
        
        // Get unique campaign IDs from completed transactions
        const campaignIds = [...new Set(
            transactions
                .filter(t => t.status === 'COMPLETED')
                .map(t => t.campaign_id)
        )];

        if (campaignIds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>You haven't made any investments yet.</p>
                    <a href="marketplace.html" class="btn btn-primary">Browse Campaigns</a>
                </div>
            `;
            return;
        }

        // Calculate totals
        let totalInvested = 0;
        transactions.forEach(t => {
            if (t.status === 'COMPLETED') {
                totalInvested += t.amount;
            }
        });

        // Update stats
        document.getElementById('total-invested').textContent = `$${totalInvested.toLocaleString()}`;
        document.getElementById('active-investments').textContent = campaignIds.length;
        document.getElementById('campaigns-backed').textContent = campaignIds.length;

        // Load campaign details for portfolio
        const campaigns = await Promise.all(
            campaignIds.slice(0, 6).map(id => API.getCampaign(id).catch(() => null))
        );

        container.innerHTML = campaigns
            .filter(c => c)
            .map(campaign => createPortfolioCard(campaign, transactions))
            .join('');

    } catch (error) {
        console.error('Failed to load portfolio:', error);
        container.innerHTML = `
            <div class="error-state">
                <p>Failed to load portfolio.</p>
            </div>
        `;
    }
}

function createPortfolioCard(campaign, transactions) {
    const invested = transactions
        .filter(t => t.campaign_id === campaign.campaign_id && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0);

    const progress = campaign.target_amount > 0 
        ? Math.round((campaign.raised_amount / campaign.target_amount) * 100) 
        : 0;

    return `
        <div class="portfolio-card">
            <div class="portfolio-header">
                <h4>${campaign.title}</h4>
                <span class="status-badge status-${campaign.status.toLowerCase()}">${campaign.status}</span>
            </div>
            <div class="portfolio-stats">
                <div class="portfolio-stat">
                    <span class="label">Your Investment</span>
                    <span class="value">$${invested.toLocaleString()}</span>
                </div>
                <div class="portfolio-stat">
                    <span class="label">Progress</span>
                    <span class="value">${progress}%</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
            <a href="campaign.html?id=${campaign.campaign_id}" class="btn btn-outline btn-sm">View Details</a>
        </div>
    `;
}

async function loadTransactions() {
    const tbody = document.getElementById('transactions-body');
    
    try {
        const transactions = await API.getMyTransactions();

        if (!transactions || transactions.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="4">No transactions yet</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transactions.slice(0, 10).map(tx => `
            <tr>
                <td>${formatDate(tx.created_at)}</td>
                <td>${tx.campaign_id.substring(0, 8)}...</td>
                <td>$${tx.amount.toLocaleString()}</td>
                <td><span class="status-badge status-${tx.status.toLowerCase()}">${tx.status}</span></td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
