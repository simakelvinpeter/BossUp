document.addEventListener("DOMContentLoaded", async () => {
  try {
    const campaigns = (await API.getCampaigns()).campaigns;
    const values = document.querySelectorAll(
      ".hero-stat-value,.hero-stat-number",
    );
    const summary = [
      campaigns.length,
      new Set(campaigns.map((c) => c.country)).size,
      moneyByCurrency(campaigns, "raised_amount"),
    ];
    const labels = ["Live campaigns", "Countries represented", "Funds raised"];
    values.forEach((element, index) => {
      element.textContent = summary[index] ?? "—";
      const label = element.parentElement.querySelector(".hero-stat-label");
      if (label) label.textContent = labels[index] || "Live data";
    });
  } catch (_) {
    document
      .querySelectorAll(".hero-stat-value,.hero-stat-number")
      .forEach((element) => (element.textContent = "—"));
  }
});
