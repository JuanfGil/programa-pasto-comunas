// ================================
// GUARD: PROTEGE PÁGINAS SEGÚN ROL
// ================================
(function () {
  const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const PUBLIC_PAGES = ["index.html"];

  if (PUBLIC_PAGES.includes(current)) return;

  let sesion = null;
  try { sesion = JSON.parse(localStorage.getItem("pasto_sesion") || "null"); } catch { sesion = null; }

  if (!sesion || !sesion.username) {
    window.location.href = "index.html";
    return;
  }

  const rol = (sesion.rol || "dinamizador").toLowerCase();
  const isFull = (rol === "admin" || rol === "gerencia" || rol === "coordinador" || rol === "supervisor");

  // Panel general: permitido para full access (incluye Darwin)
  if (current === "panel-general.html" && !isFull) {
    window.location.href = "index.html";
    return;
  }
})();
