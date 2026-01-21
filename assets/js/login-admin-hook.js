document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form || !window.PASTO_AUTH) return;

  form.addEventListener(
    "submit",
    (e) => {
      const username = (document.getElementById("username")?.value || "").trim();
      const password = (document.getElementById("password")?.value || "").trim();

      const user = window.PASTO_AUTH.AUTH_USERS.find(
        (u) => u.username === username && u.password === password
      );

      // Solo intercepta admin/gerencia/coordinador
      if (user && (user.rol === "admin" || user.rol === "gerencia" || user.rol === "coordinador")) {
        e.preventDefault();
        e.stopPropagation();

        window.PASTO_AUTH.authGuardarSesion({
          username: user.username,
          rol: user.rol,
          comuna: user.comuna
        });

        window.location.href = "panel-general.html";
      }
    },
    true // captura: corre antes que el listener del app.js
  );
});
