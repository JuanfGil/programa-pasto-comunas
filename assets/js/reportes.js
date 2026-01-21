// ================================
// CONFIGURACIÓN
// ================================
const LS_SESION_KEY = "pasto_sesion";
const LS_DATOS_KEY = "pasto_datos";

// ================================
// HELPERS LOCALSTORAGE
// ================================
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
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

// ================================
// RESUMEN GENERAL
// ================================
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
  const lideres = Array.isArray(comunaData.lideres) ? comunaData.lideres : [];

  let totalLideres = lideres.length;
  let totalPersonas = 0;
  let totalVotan = 0;

  lideres.forEach((lider) => {
    const personas = Array.isArray(lider.personas) ? lider.personas : [];
    totalPersonas += personas.length;
    personas.forEach((p) => {
      if (p.votaTeresa) totalVotan++;
    });
  });

  const totalNoVotan = totalPersonas - totalVotan;

  setText("rep-total-lideres", totalLideres);
  setText("rep-total-personas", totalPersonas);
  setText("rep-total-votan", totalVotan);
  setText("rep-total-no-votan", totalNoVotan);
}

// ================================
// GRÁFICO: PERSONAS POR LÍDER
// ================================
function renderGraficoPersonasPorLider(datos, comuna) {
  const comunaData = datos[comuna] || { lideres: [] };
  const lideres = Array.isArray(comunaData.lideres) ? comunaData.lideres : [];

  const labels = [];
  const valores = [];

  lideres.forEach((lider) => {
    labels.push(lider.nombre || `Líder ${lider.id || ""}`);
    const personas = Array.isArray(lider.personas) ? lider.personas : [];
    valores.push(personas.length);
  });

  const canvas = document.getElementById("chartPersonasPorLider");
  if (!canvas || !window.Chart) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Personas vinculadas",
          data: valores,
          borderWidth: 1
        }
      ]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          precision: 0
        }
      },
      maintainAspectRatio: true
    }
  });
}

// ================================
// GRÁFICO: COMPROMISO DE VOTO
// ================================
function renderGraficoVotan(datos, comuna) {
  const comunaData = datos[comuna] || { lideres: [] };
  const lideres = Array.isArray(comunaData.lideres) ? comunaData.lideres : [];

  let totalPersonas = 0;
  let totalVotan = 0;

  lideres.forEach((lider) => {
    const personas = Array.isArray(lider.personas) ? lider.personas : [];
    totalPersonas += personas.length;
    personas.forEach((p) => {
      if (p.votaTeresa) totalVotan++;
    });
  });

  const totalNoVotan = totalPersonas - totalVotan;

  const canvas = document.getElementById("chartVotanTeresa");
  if (!canvas || !window.Chart) return;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Votan por Teresa", "Sin compromiso"],
      datasets: [
        {
          data: [totalVotan, totalNoVotan],
          backgroundColor: ["#22c55e", "#e5e7eb"]
        }
      ]
    },
    options: {
      plugins: {
        legend: { position: "bottom" }
      },
      maintainAspectRatio: true
    }
  });
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const sesion = cargarSesionReportes();
  const reportesSection = document.getElementById("reportes-section");
  const noSessionSection = document.getElementById("no-session-section");

  if (!sesion) {
    if (reportesSection) reportesSection.style.display = "none";
    if (noSessionSection) noSessionSection.style.display = "block";
    return;
  }

  const comuna = sesion.comuna;
  const datos = cargarDatosReportes();

  renderResumenComuna(datos, comuna, sesion);
  renderGraficoPersonasPorLider(datos, comuna);
  renderGraficoVotan(datos, comuna);
});
