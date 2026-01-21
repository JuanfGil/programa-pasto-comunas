// ================================
// GUARD: PROTEGE PÁGINAS SEGÚN ROL
// ================================

(function () {
  // Qué página estoy visitando
  const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  // Páginas públicas (sin sesión)
  const PUBLIC_PAGES = ["index.html"];

  // Si es página pública, no hacemos nada
  if (PUBLIC_PAGES.includes(current)) return;

  // Leer sesión
  let sesion = null;
  try {
    sesion = JSON.parse(localStorage.getItem("pasto_sesion") || "null");
  } catch (e) {
    sesion = null;
  }

  // Si no hay sesión, sacar al login
  if (!sesion || !sesion.username) {
    window.location.href = "index.html";
    return;
  }

  const rol = (sesion.rol || "dinamizador").toLowerCase();

  // Reglas por rol
  const isAdmin = rol === "admin" || rol === "gerencia" || rol === "coordinador";
  const isDinamizador = rol === "dinamizador";

  // ✅ Admin puede ver todo
  if (isAdmin) return;

  // ✅ Dinamizador NO puede ver panel general
  if (isDinamizador && current === "panel-general.html") {
    window.location.href = "index.html";
    return;
  }

  // (A futuro: aquí agregamos más bloqueos si necesitas)
})();
