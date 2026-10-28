function setStats(items) {
  document.querySelectorAll(".stat-card").forEach((card, index) => {
    card.querySelector(".stat-card-label").textContent = items[index][0];
    card.querySelector(".stat-card-value").textContent = items[index][1];
  });
}

function table(headers, rows) {
  if (!rows.length) return '<p style="padding:24px">No records yet.</p>';
  return `<div style="overflow-x:auto"><table class="data-table"><thead><tr>${headers.map((value) => `<th>${escapeHtml(value)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

function campaignRow(campaign, approve = false) {
  const id = escapeHtml(campaign.campaign_id);
  return `<tr><td><a href="campaign.html?id=${encodeURIComponent(campaign.campaign_id)}">${escapeHtml(campaign.title)}</a></td>
    <td>${formatCurrency(campaign.target_amount, campaign.currency)}</td>
    <td>${formatCurrency(campaign.raised_amount, campaign.currency)}</td><td>${escapeHtml(campaign.status)}</td>
    ${approve ? `<td><button class="btn btn-primary" data-approve="${id}">Approve</button> <button class="btn btn-outline" data-reject="${id}">Reject</button></td>` : ""}</tr>`;
}

async function loadDashboard() {
  const records = document.getElementById("dashboard-records");
  const role = BossUp.user.role;
  if (role === "INVESTOR") {
    const donations = await API.getMyTransactions();
    const completed = donations.filter(
      (donation) => donation.status === "COMPLETED",
    );
    setStats([
      ["Donated", moneyByCurrency(completed, "amount")],
      ["Completed donations", completed.length],
      [
        "Awaiting confirmation",
        donations.filter((donation) =>
          ["PENDING", "PROCESSING"].includes(donation.status),
        ).length,
      ],
      [
        "Campaigns supported",
        new Set(completed.map((donation) => donation.campaign_id)).size,
      ],
    ]);
    document.getElementById("records-title").textContent =
      "Your donation receipts";
    records.innerHTML = table(
      ["Campaign", "Amount", "Status", "Date"],
      donations.map(
        (donation) => `<tr>
      <td><a href="campaign.html?id=${encodeURIComponent(donation.campaign_id)}">${escapeHtml(donation.campaign_id)}</a></td>
      <td>${formatCurrency(donation.amount, donation.currency)}</td><td>${escapeHtml(donation.status)}</td>
      <td>${escapeHtml(new Date(donation.created_at).toLocaleDateString())}</td></tr>`,
      ),
    );
  } else if (role === "BUSINESS_OWNER") {
    const campaigns = (await API.getMyCampaigns()).campaigns;
    setStats([
      ["Confirmed donations", moneyByCurrency(campaigns, "raised_amount")],
      ["Your campaigns", campaigns.length],
      [
        "Live campaigns",
        campaigns.filter((campaign) => campaign.status === "LIVE").length,
      ],
      [
        "Awaiting review",
        campaigns.filter((campaign) => campaign.status === "PENDING").length,
      ],
    ]);
    document.getElementById("records-title").textContent = "Your campaigns";
    records.innerHTML = table(
      ["Campaign", "Goal", "Raised", "Status"],
      campaigns.map((campaign) => campaignRow(campaign)),
    );
    document.getElementById("dashboard-message").textContent =
      "An administrator reviews campaigns before donations open. Campaign disbursements require manual settlement review.";
  } else {
    const [stats, pending, users, audit] = await Promise.all([
      API.getAdminStats(),
      API.getPendingCampaigns(),
      API.getUsers(),
      API.getAuditLogs(),
    ]);
    setStats([
      ["Campaigns", stats.total_campaigns],
      ["Live campaigns", stats.live_campaigns],
      ["Users", stats.total_users],
      ["Awaiting review", stats.pending_campaigns],
    ]);
    document.getElementById("records-title").textContent =
      "Campaign approval queue";
    records.innerHTML = table(
      ["Campaign", "Goal", "Raised", "Status", "Review"],
      pending.campaigns.map((campaign) => campaignRow(campaign, true)),
    );
    document.getElementById("admin-users").innerHTML = table(
      ["Email", "Role", "Country", "Verification"],
      users.map(
        (user) => `<tr>
      <td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.role === "INVESTOR" ? "DONOR" : user.role)}</td>
      <td>${escapeHtml(user.country)}</td><td><select data-user="${escapeHtml(user.user_id)}" aria-label="Verification for ${escapeHtml(user.email)}">
      ${["PENDING", "VERIFIED", "REJECTED"].map((status) => `<option value="${status}" ${user.kyc_status === status ? "selected" : ""}>${status}</option>`).join("")}
      </select></td></tr>`,
      ),
    );
    document.getElementById("admin-audit").innerHTML = table(
      ["Action", "User", "Time"],
      audit.map(
        (item) => `<tr>
      <td>${escapeHtml(item.action)}</td><td>${escapeHtml(item.user_id)}</td><td>${escapeHtml(item.timestamp)}</td></tr>`,
      ),
    );
    document.getElementById("dashboard-message").textContent =
      "Verify the campaign owner before approval. Only verified payment receipts count toward campaign totals.";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const path = location.pathname;
  const role = path.includes("admin.html")
    ? "ADMIN"
    : path.includes("business-dashboard")
      ? "BUSINESS_OWNER"
      : "INVESTOR";
  const user = await requireUser(role);
  if (!user) return;
  document.getElementById("dashboard-title").textContent =
    role === "ADMIN"
      ? "Admin dashboard"
      : `Welcome, ${user.full_name || user.email}`;
  try {
    await loadDashboard();
  } catch (error) {
    document.getElementById("dashboard-records").textContent = error.message;
  }
  document
    .getElementById("dashboard-records")
    .addEventListener("click", async (event) => {
      const button = event.target.closest("[data-approve], [data-reject]");
      if (!button) return;
      button.disabled = true;
      try {
        if (button.dataset.approve)
          await API.approveCampaign(button.dataset.approve);
        else {
          const reason = window.prompt("Reason for rejecting this campaign:");
          if (!reason?.trim()) return;
          await API.rejectCampaign(button.dataset.reject, reason.trim());
        }
        await loadDashboard();
      } catch (error) {
        showNotification(error.message);
      } finally {
        button.disabled = false;
      }
    });
  document
    .getElementById("admin-users")
    ?.addEventListener("change", async (event) => {
      const select = event.target.closest("[data-user]");
      if (!select) return;
      select.disabled = true;
      try {
        await API.updateUserKYC(select.dataset.user, select.value);
        await loadDashboard();
      } catch (error) {
        showNotification(error.message);
      } finally {
        select.disabled = false;
      }
    });
});
