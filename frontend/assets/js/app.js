/* Shared display helpers. Authentication stays in an HttpOnly server cookie. */
const BossUp = {
  user: null,
  ready: API.getCurrentUser()
    .then((user) => {
      BossUp.user = user;
      return user;
    })
    .catch(() => null),
};

function dashboardUrl(role) {
  if (role === "ADMIN") return "/admin.html";
  if (role === "BUSINESS_OWNER") return "/business-dashboard.html";
  return "/investor-dashboard.html";
}

async function requireUser(role) {
  const user = await BossUp.ready;
  if (!user) {
    window.location.href = "/login.html";
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = dashboardUrl(user.role);
    return null;
  }
  return user;
}

function signOut() {
  return API.logout();
}
function formatCurrency(amount, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(
    amount,
  );
}
function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}
function safeImage(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch (_) {
    return "";
  }
}
function showNotification(message) {
  const notice = document.createElement("div");
  notice.className = "bossup-notice";
  notice.style.cssText =
    "position:fixed;top:20px;right:20px;padding:16px;background:#1a4d2e;color:white;border-radius:10px;z-index:9999;max-width:380px";
  notice.textContent = message;
  document.body.append(notice);
  setTimeout(() => notice.remove(), 6000);
}
function moneyByCurrency(records, amountKey) {
  const totals = {};
  records.forEach((record) => {
    const currency = record.currency || "KES";
    totals[currency] = (totals[currency] || 0) + Number(record[amountKey] || 0);
  });
  return (
    Object.entries(totals)
      .map(([currency, amount]) => formatCurrency(amount, currency))
      .join(" · ") || "0"
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await BossUp.ready;
  document
    .querySelectorAll("[data-logout]")
    .forEach((button) => button.addEventListener("click", signOut));
  document.querySelectorAll(".user-name, .profile-name").forEach((element) => {
    element.textContent = user?.full_name || user?.email || "Guest";
  });
  const actions = document.querySelector(".nav-actions");
  if (actions && user) {
    actions.innerHTML = `<a class="btn btn-outline" href="${dashboardUrl(user.role)}">Dashboard</a><button class="btn btn-primary" data-logout>Sign out</button>`;
    actions.querySelector("[data-logout]").addEventListener("click", signOut);
  }
  document.querySelectorAll(".mobile-menu-toggle").forEach((button) => {
    button.addEventListener("click", () =>
      document.querySelector(".sidebar")?.classList.toggle("open"),
    );
  });
});
