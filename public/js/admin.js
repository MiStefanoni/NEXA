// This frontend password is only for MVP testing and is not secure for production.
const ADMIN_PASSWORD = "change-this-password";
const ADMIN_ACCESS_KEY = "nexa_admin_access";

function isAdminAuthenticated() {
  return window.localStorage.getItem(ADMIN_ACCESS_KEY) === "true";
}

function setAdminError(message) {
  const errorNode = document.querySelector("[data-admin-error]");
  if (!errorNode) return;

  errorNode.textContent = message || "";
  errorNode.classList.toggle("is-visible", Boolean(message));
}

function setupAdminLogin() {
  const form = document.querySelector("[data-admin-login-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const password = String(formData.get("password") || "");

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem(ADMIN_ACCESS_KEY, "true");
      window.location.href = "/admin.html";
      return;
    }

    setAdminError("Não foi possível acessar. Verifique a senha e tente novamente.");
  });
}

function setupAdminDashboard() {
  if (!isAdminAuthenticated()) {
    window.location.href = "/admin-login.html";
    return;
  }

  const logoutButton = document.querySelector("[data-admin-logout]");
  logoutButton?.addEventListener("click", () => {
    window.localStorage.removeItem(ADMIN_ACCESS_KEY);
    window.location.href = "/admin-login.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.adminPage === "login") {
    setupAdminLogin();
  }

  if (document.body.dataset.adminPage === "dashboard") {
    setupAdminDashboard();
  }
});
