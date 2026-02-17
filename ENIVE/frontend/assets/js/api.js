/**
 * BossUp API Client
 * =================
 * Centralized API communication layer.
 * All backend calls go through this module.
 * 
 * Security:
 * - JWT stored in localStorage (consider httpOnly cookies for production)
 * - Token auto-attached to requests
 * - No sensitive operations in frontend
 */

const API_BASE_URL = 'http://localhost:8000';

// Token management
const TokenManager = {
    getToken() {
        return localStorage.getItem('bossup_token');
    },

    setToken(token) {
        localStorage.setItem('bossup_token', token);
    },

    removeToken() {
        localStorage.removeItem('bossup_token');
    },

    getUserData() {
        const data = localStorage.getItem('bossup_user');
        return data ? JSON.parse(data) : null;
    },

    setUserData(data) {
        localStorage.setItem('bossup_user', JSON.stringify(data));
    },

    clearAll() {
        localStorage.removeItem('bossup_token');
        localStorage.removeItem('bossup_user');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};

// API Client
const API = {
    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = TokenManager.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle 401 - redirect to login
            if (response.status === 401) {
                TokenManager.clearAll();
                window.location.href = '/login.html';
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // =========================================================================
    // AUTH ENDPOINTS
    // =========================================================================

    async signup(email, password, role, country, fullName = null) {
        const response = await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
                role,
                country,
                full_name: fullName
            })
        });

        if (response) {
            TokenManager.setToken(response.access_token);
            TokenManager.setUserData({
                user_id: response.user_id,
                role: response.role
            });
        }

        return response;
    },

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response) {
            TokenManager.setToken(response.access_token);
            TokenManager.setUserData({
                user_id: response.user_id,
                role: response.role
            });
        }

        return response;
    },

    async getCurrentUser() {
        return this.request('/auth/me');
    },

    logout() {
        TokenManager.clearAll();
        window.location.href = '/login.html';
    },

    // =========================================================================
    // CAMPAIGN ENDPOINTS
    // =========================================================================

    async getCampaigns(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.country) params.append('country', filters.country);
        if (filters.limit) params.append('limit', filters.limit);

        const query = params.toString();
        return this.request(`/campaigns${query ? '?' + query : ''}`);
    },

    async getCampaign(campaignId) {
        return this.request(`/campaigns/${campaignId}`);
    },

    async getMyCampaigns() {
        return this.request('/campaigns/my');
    },

    async createCampaign(data) {
        return this.request('/campaigns', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateCampaign(campaignId, data) {
        return this.request(`/campaigns/${campaignId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // =========================================================================
    // PAYMENT ENDPOINTS
    // =========================================================================

    async initiatePayment(campaignId, amount, currency = 'USD') {
        return this.request('/payments/initiate', {
            method: 'POST',
            body: JSON.stringify({
                campaign_id: campaignId,
                amount,
                currency
            })
        });
    },

    async getMyTransactions() {
        return this.request('/payments/my');
    },

    async getTransaction(transactionId) {
        return this.request(`/payments/${transactionId}`);
    },

    // =========================================================================
    // ADMIN ENDPOINTS
    // =========================================================================

    async getAdminStats() {
        return this.request('/admin/stats');
    },

    async getPendingCampaigns() {
        return this.request('/admin/campaigns/pending');
    },

    async getAllCampaigns(status = null) {
        const params = status ? `?status=${status}` : '';
        return this.request(`/admin/campaigns/all${params}`);
    },

    async approveCampaign(campaignId) {
        return this.request(`/admin/campaigns/${campaignId}/approve`, {
            method: 'POST'
        });
    },

    async rejectCampaign(campaignId, reason) {
        return this.request(`/admin/campaigns/${campaignId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    },

    async getUsers(filters = {}) {
        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.kyc_status) params.append('kyc_status', filters.kyc_status);

        const query = params.toString();
        return this.request(`/admin/users${query ? '?' + query : ''}`);
    },

    async updateUserKYC(userId, status) {
        return this.request(`/admin/users/${userId}/kyc`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    },

    async getAuditLogs(filters = {}) {
        const params = new URLSearchParams();
        if (filters.action) params.append('action', filters.action);
        if (filters.user_id) params.append('user_id', filters.user_id);
        if (filters.limit) params.append('limit', filters.limit);

        const query = params.toString();
        return this.request(`/admin/audit-logs${query ? '?' + query : ''}`);
    }
};

// Role-based redirect helper
function redirectToDashboard(role) {
    switch (role) {
        case 'INVESTOR':
            window.location.href = '/investor-dashboard.html';
            break;
        case 'BUSINESS_OWNER':
            window.location.href = '/business-dashboard.html';
            break;
        case 'ADMIN':
            window.location.href = '/admin.html';
            break;
        default:
            window.location.href = '/index.html';
    }
}

// Auth guard - call on protected pages
function requireAuth(allowedRoles = null) {
    if (!TokenManager.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }

    const userData = TokenManager.getUserData();
    if (allowedRoles && !allowedRoles.includes(userData?.role)) {
        redirectToDashboard(userData?.role);
        return false;
    }

    return true;
}

// Export for use in other scripts
window.API = API;
window.TokenManager = TokenManager;
window.redirectToDashboard = redirectToDashboard;
window.requireAuth = requireAuth;
