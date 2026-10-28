document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", togglePassword);
  });
  const signup = document.getElementById("signupForm");
  const form = signup || document.getElementById("loginForm");
  const error = document.getElementById("errorMessage");
  const button = document.getElementById("submitBtn");
  const role = new URLSearchParams(location.search).get("role");
  if (signup && ["business", "BUSINESS_OWNER"].includes(role))
    document.getElementById("roleBusiness").checked = true;
  const user = await BossUp.ready;
  if (user) location.href = dashboardUrl(user.role);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    error.classList.remove("show");
    button.disabled = true;
    try {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      if (signup) {
        await API.signup(
          email,
          password,
          form.querySelector('[name="role"]:checked').value,
          document.getElementById("country").value,
          document.getElementById("fullName").value.trim(),
        );
      } else {
        await API.login(email, password);
      }
      const profile = await API.getCurrentUser();
      location.href = dashboardUrl(profile.role);
    } catch (problem) {
      error.textContent = problem.message;
      error.classList.add("show");
    } finally {
      button.disabled = false;
    }
  });
});

function togglePassword() {
  const field = document.getElementById("password");
  field.type = field.type === "password" ? "text" : "password";
}
