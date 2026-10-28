const draftFields = [
  "ventureName",
  "category",
  "amountNeeded",
  "pitch",
  "country",
  "currency",
];

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireUser("BUSINESS_OWNER");
  if (!user) return;
  document.getElementById("authGate").style.display = "none";
  document.getElementById("mainApp").style.display = "flex";
  const email = document.getElementById("contactEmail");
  email.value = user.email;
  email.readOnly = true;
  const form = document.getElementById("campaignForm");
  try {
    const draft = JSON.parse(
      localStorage.getItem("bossup_campaign_draft") || "{}",
    );
    draftFields.forEach((id) => {
      if (draft[id]) document.getElementById(id).value = draft[id];
    });
  } catch (_) {
    localStorage.removeItem("bossup_campaign_draft");
  }
  document.getElementById("save-draft")?.addEventListener("click", () => {
    const draft = Object.fromEntries(
      draftFields.map((id) => [id, document.getElementById(id).value]),
    );
    localStorage.setItem("bossup_campaign_draft", JSON.stringify(draft));
    showNotification("Draft saved in this browser.");
  });
  document.getElementById("preview-campaign")?.addEventListener("click", () => {
    const preview = document.querySelector(".preview-modal");
    showNotification(
      document.getElementById("ventureName").value +
        ": " +
        document.getElementById("pitch").value.slice(0, 180),
    );
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("submitBtn");
    button.disabled = true;
    try {
      await API.createCampaign({
        title: document.getElementById("ventureName").value.trim(),
        category: document.getElementById("category").value,
        target_amount: Number(document.getElementById("amountNeeded").value),
        description: document.getElementById("pitch").value.trim(),
        country: document.getElementById("country").value,
        currency: document.getElementById("currency").value,
      });
      localStorage.removeItem("bossup_campaign_draft");
      location.href = "business-dashboard.html";
    } catch (error) {
      showNotification(error.message);
      button.disabled = false;
    }
  });
});
