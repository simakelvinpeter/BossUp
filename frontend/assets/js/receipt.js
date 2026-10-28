document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireUser("INVESTOR");
  if (!user) return;
  const status = document.getElementById("receipt-status");
  const parameters = new URLSearchParams(location.search);
  const reference = parameters.get("tx_ref");
  const providerId = parameters.get("transaction_id");
  if (!reference || !providerId) {
    status.textContent =
      "No completed payment was supplied. Check your donations dashboard. A cancelled checkout is not a receipt.";
    return;
  }
  try {
    const donation = await API.confirmPayment(reference, providerId);
    status.textContent = `Confirmed: ${formatCurrency(donation.amount, donation.currency)}. Receipt ${donation.transaction_id}. Thank you for your support.`;
  } catch (error) {
    status.textContent =
      error.message +
      ". No success receipt has been issued. Check your dashboard later if the provider is still processing the payment.";
  }
});
