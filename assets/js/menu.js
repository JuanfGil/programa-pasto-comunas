document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const nav = document.querySelector(".sidebar-nav");

  // Si no existe menú en esta página, no hacemos nada
  if (!toggleBtn || !sidebar || !nav) return;

  // 🔥 Menú único para TODAS las páginas
  nav.innerHTML = `
    <a href="index.html">Captura</a>
    <a href="reportes.html">Reportes</a>
    <a href="reuniones.html">Reuniones</a>
    <a href="compromisos.html">Compromisos</a>
    <a href="panel-general.html">Panel general</a>
  `;

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
