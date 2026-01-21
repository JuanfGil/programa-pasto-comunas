document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const nav = document.querySelector(".sidebar-nav");

  if (!toggleBtn || !sidebar || !nav) return;

  // Leer sesión
  let sesion = null;
  try {
    sesion = JSON.parse(localStorage.getItem("pasto_sesion") || "null");
  } catch (e) {
    sesion = null;
  }

  const rol = (sesion && sesion.rol ? sesion.rol : "dinamizador").toLowerCase();

  // Menú base
  let menuHTML = `
    <a href="index.html">Captura</a>
    <a href="reportes.html">Reportes</a>
    <a href="reuniones.html">Reuniones</a>
    <a href="compromisos.html">Compromisos</a>
  `;

  // Panel general solo para roles admin/gerencia/coordinador
  if (rol === "admin" || rol === "gerencia" || rol === "coordinador") {
    menuHTML += `<a href="panel-general.html">Panel general</a>`;
  }

  nav.innerHTML = menuHTML;

  // Toggle abrir/cerrar
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Cerrar al hacer click fuera
  document.addEventListener("click", (e) => {
    const clickedInside = sidebar.contains(e.target) || toggleBtn.contains(e.target);
    if (!clickedInside && sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
    }
  });

  // Marcar activo
  const current = window.location.pathname.split("/").pop() || "index.html";
  const links = nav.querySelectorAll("a");
  links.forEach((a) => {
    const href = a.getAttribute("href");
    if (href === current) a.classList.add("active");
  });
});
