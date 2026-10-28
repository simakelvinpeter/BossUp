const countries = {
  burundi: "BI",
  kenya: "KE",
  uganda: "UG",
  tanzania: "TZ",
  rwanda: "RW",
};
let campaigns = [];
let selectedCountry = "";

function campaignCard(campaign) {
  const percent = Math.min(
    100,
    Math.round((campaign.raised_amount / campaign.target_amount) * 100),
  );
  const image = safeImage(campaign.image_url);
  return `<div class="campaign-card">
    <div class="campaign-image">${image ? `<img src="${escapeHtml(image)}" alt="">` : '<div style="height:180px;background:#1a4d2e"></div>'}
      <span class="campaign-location">${escapeHtml(countryName(campaign.country))}</span>
    </div>
    <div class="campaign-content">
      <h3 class="campaign-title">${escapeHtml(campaign.title)}</h3>
      <p class="campaign-description">${escapeHtml(campaign.description.slice(0, 150))}</p>
      <div class="campaign-stats">
        <div class="campaign-stat"><div class="campaign-stat-label">Goal</div><div class="campaign-stat-value">${formatCurrency(campaign.target_amount, campaign.currency)}</div></div>
        <div class="campaign-stat"><div class="campaign-stat-label">Category</div><div class="campaign-stat-value">${escapeHtml(campaign.category || "General")}</div></div>
      </div>
      <div class="campaign-progress-row"><span>${formatCurrency(campaign.raised_amount, campaign.currency)}</span><span>${percent}% funded</span></div>
      <div class="campaign-progress"><div class="campaign-progress-fill" style="width:${percent}%"></div></div>
      <a class="view-campaign-btn" href="campaign.html?id=${encodeURIComponent(campaign.campaign_id)}">View campaign</a>
    </div>
  </div>`;
}

function renderCampaigns() {
  let list = campaigns.filter(
    (campaign) => !selectedCountry || campaign.country === selectedCountry,
  );
  const sort = document.getElementById("sortSelect").value;
  list = [...list].sort((a, b) =>
    sort === "funded"
      ? b.raised_amount / b.target_amount - a.raised_amount / a.target_amount
      : new Date(b.created_at) - new Date(a.created_at),
  );
  document.getElementById("campaignsGrid").innerHTML =
    list.map(campaignCard).join("") ||
    "<p>No live campaigns match this country yet.</p>";
  document.getElementById("resultsCount").textContent = list.length;
}

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".country-pill").forEach((button) => {
    const key = button.dataset.country;
    if (key !== "all" && !countries[key]) {
      button.remove();
      return;
    }
    button.addEventListener("click", () => {
      selectedCountry = countries[key] || "";
      document
        .querySelector(".country-pill.active")
        ?.classList.remove("active");
      button.classList.add("active");
      renderCampaigns();
    });
  });
  document
    .getElementById("sortSelect")
    .querySelectorAll("option")
    .forEach((option) => {
      if (!["newest", "funded"].includes(option.value)) option.remove();
      if (option.value === "funded")
        option.textContent = "Highest funding percentage";
    });
  document
    .getElementById("sortSelect")
    .addEventListener("change", renderCampaigns);
  try {
    campaigns = (await API.getCampaigns()).campaigns;
    document.querySelectorAll(".hero-stat-value").forEach((value, index) => {
      value.textContent = index === 0 ? "Donations" : campaigns.length;
    });
    document.querySelectorAll(".hero-stat-label").forEach((label, index) => {
      label.textContent = index === 0 ? "Campaign model" : "Live campaigns";
    });
    renderCampaigns();
  } catch (error) {
    document.getElementById("campaignsGrid").textContent = error.message;
  }
});

document.addEventListener("bossup-language-change", renderCampaigns);
