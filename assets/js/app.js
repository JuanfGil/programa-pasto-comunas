// Mismas claves usadas en app.js
const LS_LIDERES_KEY = "pasto_lideres";
const LS_PERSONAS_KEY = "pasto_personas";
const LS_SESION_KEY = "pasto_sesion";

let lideres = [];
let personas = [];
let comunaActual = null;
let usuarioActual = null;

// Charts
let chartPersonasPorLider = null;
let chartVotanTeresa = null;

// ====== CARGA DE DATOS ====== //
function cargarDatos() {
  try {
    const l = JSON.parse(localStorage.getItem(LS_LIDERES_KEY) || "[]");
    const p = JSON.parse(localStorage.getItem(LS_PERSONAS_KEY) || "[]");
    if (Array.isArray(l)) lideres = l;
    if (Array.isArray(p)) personas = p;
  } catch (e) {
    console.warn("Error al cargar datos de localStorage en reportes:", e);
    lideres = [];
    personas = [];
  }
}

function cargarSesion() {
  try {
    const raw = localStorage.getItem(LS_SESION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion || !sesion.username || !sesion.comuna) return null;
    return sesion;
  } catch (e) {
    console.warn("Error al cargar sesión en reportes:", e);
    return null;
  }
}

// ====== INICIALIZACIÓN DE LA PÁGINA DE REPORTES ====== //
document.addEventListener("DOMContentLoaded", () => {
  const noSessionSection = document.getElementById("no-session-section");
  const reportesSection = document.getElementById("reportes-section");

  const sesion = cargarSesion();
  if (!sesion) {
    // No hay sesión, mostramos aviso
    noSessionSection.style.display = "block";
    reportesSection.style.display = "none";
    return;
  }

  usuarioActual = sesion.username;
  comunaActual = sesion.comuna;

  cargarDatos();

  // Filtrar datos de la comuna
  const lideresComuna = lideres.filter((l) => l.comuna === comunaActual);
  const personasComuna = personas.filter((p) => p.comuna === comunaActual);

  // Si no hay datos, igual mostramos la página pero con ceros
  noSessionSection.style.display = "none";
  reportesSection.style.display = "block";

  // Referencias
  const repComunaTitle = document.getElementById("rep-comuna-title");
  const repUserInfo = document.getElementById("rep-user-info");
  const repTotalLideres = document.getElementById("rep-total-lideres");
  const repTotalPersonas = document.getElementById("rep-total-personas");
  const repTotalVotan = document.getElementById("rep-total-votan");
  const repTotalNoVotan = document.getElementById("rep-total-no-votan");

  repComunaTitle.textContent = comunaActual;
  repUserInfo.textContent = `Sesión activa como: ${usuarioActual}`;

  const totalLideres = lideresComuna.length;
  const totalPersonas = personasComuna.length;
  const totalVotan = personasComuna.filter((p) => p.votaTeresa).length;
  const totalNoVotan = totalPersonas - totalVotan;

  repTotalLideres.textContent = totalLideres;
  repTotalPersonas.textContent = totalPersonas;
  repTotalVotan.textContent = totalVotan;
  repTotalNoVotan.textContent = totalNoVotan;

  // Dibujar gráficos
  inicializarGraficos(lideresComuna, personasComuna);
});

// ====== GRÁFICOS ====== //
function inicializarGraficos(lideresComuna, personasComuna) {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js no está disponible en reportes.");
    return;
  }

  const canvasPersonasPorLider = document.getElementById("chartPersonasPorLider");
  const canvasVotanTeresa = document.getElementById("chartVotanTeresa");

  if (!canvasPersonasPorLider || !canvasVotanTeresa) {
    console.warn("No se encontraron los canvas de gráficos en reportes.");
    return;
  }

  // --- Gráfico de barras: personas por líder --- //
  const labelsLideres = lideresComuna.map((l) => l.nombre);
  const datosPersonasPorLider = lideresComuna.map((l) =>
    personasComuna.filter((p) => p.liderId === l.id).length
  );

  const dataBar = {
    labels: labelsLideres,
    datasets: [
      {
        label: "Personas vinculadas",
        data: datosPersonasPorLider,
      },
    ],
  };

  const configBar = {
    type: "bar",
    data: dataBar,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
    },
  };

  chartPersonasPorLider = new Chart(canvasPersonasPorLider, configBar);

  // --- Gráfico de pastel: votan vs no votan --- //
  const totalPersonas = personasComuna.length;
  const totalVotan = personasComuna.filter((p) => p.votaTeresa).length;
  const totalNoVotan = totalPersonas - totalVotan;

  const dataPie = {
    labels: ["Votan por Teresa", "Sin compromiso"],
    datasets: [
      {
        data: [totalVotan, totalNoVotan],
      },
    ],
  };

  const configPie = {
    type: "pie",
    data: dataPie,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  };

  chartVotanTeresa = new Chart(canvasVotanTeresa, configPie);
}
