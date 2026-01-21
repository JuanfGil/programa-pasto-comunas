/* ========================================================
   CONFIGURACIÓN
======================================================== */
const LS_SESION_KEY = "pasto_sesion";
const LS_DATOS_KEY = "pasto_datos";

/* ========================================================
   REGISTRO GLOBAL PARA GRÁFICOS (FIX)
======================================================== */
const chartInstances = {
  personasPorLider: null,
  votan: null,
  compromisos: null,
};

/* ========================================================
   LOCAL STORAGE HELPERS
======================================================== */
function cargarSesionReportes() {
  try {
    const raw = localStorage.getItem(LS_SESION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion || !sesion.username || !sesion.comuna) return null;
    return sesion;
  } catch {
    return null;
  }
}

function cargarDatosReportes() {
  try {
    const raw = localStorage.getItem(LS_DATOS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

/* ========================================================
   RENDER RESUMEN GENERAL
======================================================== */
function renderResumenComuna(datos, comuna, sesion) {
  const reportesSection = document.getElementById("reportes-section");
  const noSessionSection = document.getElementById("no-session-section");
  const titulo = document.getElementById("rep-comuna-title");
  const infoUsuario = document.getElementById("rep-user-info");

  if (!sesion) {
    if (reportesSection) reportesSection.style.display = "none";
    if (noSessionSection) noSessionSection.style.display = "block";
    return;
  }

  if (reportesSection) reportesSection.style.display = "block";
  if (noSessionSection) noSessionSection.style.display = "none";

  if (titulo) titulo.textContent = comuna;
  if (infoUsuario) infoUsuario.textContent = `Sesión activa como: ${sesion.username}`;

  const comunaData = datos[comuna] || { lideres: [] };
  const lideres = comunaData.lideres || [];

  let totalLideres = lideres.length;
  let totalPersonas = 0;
  let totalVotan = 0;

  lideres.forEach((lider) => {
    const personas = lider.personas || [];
    totalPersonas += personas.length;
    personas.forEach((p) => {
      if (p.votaTeresa) totalVotan++;
    });
  });

  const totalNoVotan = totalPersonas - totalVotan;

  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  set("rep-total-lideres", totalLideres);
  set("rep-total-personas", totalPersonas);
  set("rep-total-votan", totalVotan);
  set("rep-total-no-votan", totalNoVotan);
}

/* ========================================================
   RENDER COMPROMISOS
======================================================== */
function renderCompromisosResumen(comuna) {
  let arr = JSON.parse(localStorage.getItem("pasto_compromisos") || "[]");
  if (!Array.isArray(arr)) arr = [];

  arr = arr.filter((c) => c.comuna === comuna);

  const total = arr.length;
  const pendientes = arr.filter((c) => c.estado === "pendiente").length;
  const gestion = arr.filter((c) => c.estado === "gestion").length;
  const cumplidos = arr.filter((c) => c.estado === "cumplido").length;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("rep-comp-total", total);
  set("rep-comp-pendientes", pendientes);
  set("rep-comp-gestion", gestion);
  set("rep-comp-cumplidos", cumplidos);

  const canvas = document.getElementById("chartCompromisos");
  if (!canvas || !window.Chart) return;

  if (chartInstances.compromisos) chartInstances.compromisos.destroy();

  chartInstances.compromisos = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Pendientes", "En gestión", "Cumplidos"],
      datasets: [
        {
          data: [pendientes, gestion, cumplidos],
          backgroundColor: ["#fbbf24", "#38bdf8", "#22c55e"],
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      maintainAspectRatio: true,
    },
  });
}

/* ========================================================
   GRÁFICO PERSONAS POR LÍDER
======================================================== */
function renderGraficoPersonasPorLider(datos, comuna) {
  const comunaData = datos[comuna] || { lideres: [] };
  const labels = [];
  const valores = [];

  comunaData.lideres.forEach((l) => {
    labels.push(l.nombre || "Líder");
    valores.push((l.personas || []).length);
  });

  const canvas = document.getElementById("chartPersonasPorLider");
  if (!canvas || !window.Chart) return;

  if (chartInstances.personasPorLider) chartInstances.personasPorLider.destroy();

  chartInstances.personasPorLider = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ data: valores, borderWidth: 1 }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, precision: 0 } },
      maintainAspectRatio: true,
    },
  });
}

/* ========================================================
   GRÁFICO COMPROMISO DE VOTO
======================================================== */
function renderGraficoVotan(datos, comuna) {
  const comunaData = datos[comuna] || { lideres: [] };
  let total = 0;
  let votan = 0;

  comunaData.lideres.forEach((l) => {
    const personas = l.personas || [];
    total += personas.length;
    personas.forEach((p) => { if (p.votaTeresa) votan++; });
  });

  const noVotan = total - votan;

  const canvas = document.getElementById("chartVotanTeresa");
  if (!canvas || !window.Chart) return;

  if (chartInstances.votan) chartInstances.votan.destroy();

  chartInstances.votan = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Votan por Teresa", "Sin compromiso"],
      datasets: [{ data: [votan, noVotan], backgroundColor: ["#22c55e", "#e5e7eb"] }],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      maintainAspectRatio: true,
    },
  });
}

/* ========================================================
   INIT
======================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const sesion = cargarSesionReportes();
  if (!sesion) {
    document.getElementById("reportes-section").style.display = "none";
    document.getElementById("no-session-section").style.display = "block";
    return;
  }

  const comuna = sesion.comuna;
  const datos = cargarDatosReportes();

  renderResumenComuna(datos, comuna, sesion);
  renderCompromisosResumen(comuna);
  renderGraficoPersonasPorLider(datos, comuna);
  renderGraficoVotan(datos, comuna);
});
