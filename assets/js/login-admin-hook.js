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

      if (!user) return;

      // Si es admin/gerencia/coordinador: guardamos sesión, pero NO redirigimos
      if (user.rol === "admin" || user.rol === "gerencia" || user.rol === "coordinador") {
        e.preventDefault();
        e.stopPropagation();

        window.PASTO_AUTH.authGuardarSesion({
          username: user.username,
          rol: user.rol,
          comuna: user.comuna
        });

        // Recargar para que tu app.js muestre la vista y el menú cambie por rol
        window.location.reload();
      }
    },
    true
  );
});
