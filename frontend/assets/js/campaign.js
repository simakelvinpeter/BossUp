document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(location.search).get("id");
  const message = document.getElementById("donation-message");
  const form = document.getElementById("donation-form");
  let campaign;
  try {
    if (!id) throw new Error("Choose a campaign from the marketplace.");
    campaign = await API.getCampaign(id);
    document.querySelector(".campaign-main h1").textContent = campaign.title;
    document.title = campaign.title + " - BossUp";
    document.getElementById("campaign-story").textContent =
      campaign.description;
    document.querySelector(".tag-category").textContent =
      campaign.category || "General";
    document.querySelector(".tag-location").textContent = campaign.country;
    document.querySelector(".tag-verified").textContent =
      campaign.status === "LIVE" ? "Administrator reviewed" : campaign.status;
    document.querySelector(".invest-raised").textContent = formatCurrency(
      campaign.raised_amount,
      campaign.currency,
    );
    document.querySelector(".invest-goal").textContent =
      "of " +
      formatCurrency(campaign.target_amount, campaign.currency) +
      " goal";
    const percent = Math.min(
      100,
      Math.round((campaign.raised_amount / campaign.target_amount) * 100),
    );
    document.querySelector(".invest-progress-fill").style.width = percent + "%";
    document.querySelector(".invest-meta span").textContent =
      percent + "% funded";
    document.getElementById("donation-currency").textContent =
      campaign.currency;
    const image = safeImage(campaign.image_url);
    if (image) {
      document.getElementById("galleryImage").src = image;
      document.getElementById("galleryImage").hidden = false;
    }
    if (campaign.status !== "LIVE") {
      form.querySelector("button").disabled = true;
      message.textContent = "This campaign is not accepting donations.";
    }
  } catch (error) {
    document.querySelector(".campaign-main h1").textContent =
      "Campaign unavailable";
    message.textContent = error.message;
    form.querySelector("button").disabled = true;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = await requireUser("INVESTOR");
    if (!user || !campaign) return;
    const button = form.querySelector("button");
    button.disabled = true;
    message.textContent = "Opening secure checkout…";
    try {
      const amount = document.getElementById("donation-amount").value;
      const session = await API.initiatePayment(id, amount, campaign.currency);
      location.href = session.checkout_url;
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });
});
