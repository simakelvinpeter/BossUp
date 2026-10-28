/* All requests go to the backend served on this same origin. */
const API = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const data = await response.json();
    if (!response.ok) {
      const message =
        typeof data.detail === "string"
          ? data.detail
          : "Please check the form and try again.";
      throw new Error(message);
    }
    return data;
  },
  login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  signup(email, password, role, country, fullName) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        role,
        country,
        full_name: fullName,
      }),
    });
  },
  getCurrentUser() {
    return this.request("/auth/me");
  },
  async logout() {
    await this.request("/auth/logout", { method: "POST" });
    window.location.href = "/login.html";
  },
  getCampaigns(filters = {}) {
    return this.request("/campaigns?" + new URLSearchParams(filters));
  },
  getCampaign(id) {
    return this.request("/campaigns/" + encodeURIComponent(id));
  },
  createCampaign(data) {
    return this.request("/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getMyCampaigns() {
    return this.request("/campaigns/my");
  },
  initiatePayment(id, amount, currency) {
    return this.request("/payments/initiate", {
      method: "POST",
      body: JSON.stringify({ campaign_id: id, amount, currency }),
    });
  },
  getMyTransactions() {
    return this.request("/payments/my");
  },
  confirmPayment(id, providerId) {
    return this.request("/payments/confirm", {
      method: "POST",
      body: JSON.stringify({
        transaction_id: id,
        gateway_reference: providerId,
      }),
    });
  },
  getPendingCampaigns() {
    return this.request("/admin/campaigns/pending");
  },
  getAdminStats() {
    return this.request("/admin/stats");
  },
  getUsers() {
    return this.request("/admin/users");
  },
  getAuditLogs() {
    return this.request("/admin/audit-logs");
  },
  approveCampaign(id) {
    return this.request(
      "/admin/campaigns/" + encodeURIComponent(id) + "/approve",
      { method: "POST" },
    );
  },
  rejectCampaign(id, reason) {
    return this.request(
      "/admin/campaigns/" + encodeURIComponent(id) + "/reject",
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
    );
  },
  updateUserKYC(id, status) {
    return this.request("/admin/users/" + encodeURIComponent(id) + "/kyc", {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },
};
