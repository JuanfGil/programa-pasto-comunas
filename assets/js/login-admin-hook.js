document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");

  if (!form || !window.PASTO_AUTH) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = (document.getElementById("username")?.value || "").trim();
    const password = (document.getElementById("password")?.value || "").trim();

    const user = window.PASTO_AUTH.authLogin(username, password);

    if (!user) {
      if (errorEl) errorEl.style.display = "block";
      return;
    }

    if (errorEl) errorEl.style.display = "none";

    // Recargar para que tu app detecte la sesión y muestre la comuna / menú
    window.location.reload();
  });
});
