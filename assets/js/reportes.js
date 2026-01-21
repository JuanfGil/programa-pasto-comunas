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
    noSessionSection.style.display = "block";
    reportesSection.style.display = "none";
    return;
  }

  usuarioActual = sesion.username;
  comunaActual = sesion.comuna;

  cargarDatos();

  const lideresComuna = lideres.filter((l) => l.comuna === comunaActual);
  const personasComuna = personas.filter((p) => p.comuna === comunaActual);

  noSessionSection.style.display = "none";
  reportesSection.style.display = "block";

  const repComunaTitle = document.getElementById("rep-comuna-title");
  const repUserInfo = document.getElementById("rep-user-info");
  const repTotalLideres = document.getElementById("rep-total-lideres");
  const repTotalPersonas = document.getElementById("rep-total-personas");
  const repTotalVotan = document.getElementById("rep-total-votan");
  const repTotalNoVotan = document.getElementById("rep-total-no-votan");
  const btnExportarCsv = document.getElementById("btn-exportar-csv");

  repComunaTitle.textContent = comunaActual;
  repUserInfo.textContent = `Sesión activa como: ${usuarioActual}`;
@@ -82,6 +83,13 @@
  repTotalVotan.textContent = totalVotan;
  repTotalNoVotan.textContent = totalNoVotan;

  // Botón descargar CSV
  if (btnExportarCsv) {
    btnExportarCsv.addEventListener("click", () => {
      exportarCsvComuna(lideresComuna, personasComuna);
    });
  }

  inicializarGraficos(lideresComuna, personasComuna);
});

@@ -170,3 +178,95 @@

  chartVotanTeresa = new Chart(canvasVotanTeresa, configPie);
}

// ====== EXPORTAR CSV ====== //
function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function exportarCsvComuna(lideresComuna, personasComuna) {
  if (!comunaActual) {
    alert("No hay comuna activa para exportar.");
    return;
  }

  // Mapa rápido de líderes por id
  const mapaLiderPorId = new Map();
  lideresComuna.forEach((l) => mapaLiderPorId.set(l.id, l));

  const filas = [];

  // Encabezados
  filas.push([
    "Comuna",
    "Tipo registro",
    "Nombre",
    "Documento",
    "Teléfono",
    "Dirección",
    "Zona votación",
    "Tipo líder",
    "Líder responsable",
    "Conoce líder",
    "Vota Teresa",
  ].map(escapeCsv).join(";"));

  // Líderes
  lideresComuna.forEach((l) => {
    const fila = [
      comunaActual,
      "Líder",
      l.nombre || "",
      l.documento || "",
      l.telefono || "",
      l.direccion || "",
      l.zona || "",
      l.tipo || "",
      "",          // líder responsable (no aplica para líder)
      "",          // conoce líder
      "",          // vota Teresa
    ];
    filas.push(fila.map(escapeCsv).join(";"));
  });

  // Personas vinculadas
  personasComuna.forEach((p) => {
    const lider = mapaLiderPorId.get(p.liderId) || {};
    const fila = [
      comunaActual,
      "Persona",
      p.nombre || "",
      p.documento || "",
      p.telefono || "",
      p.direccion || "",
      p.zona || "",
      lider.tipo || "",
      lider.nombre || "",
      p.conoceLider ? "Sí" : "No",
      p.votaTeresa ? "Sí" : "No",
    ];
    filas.push(fila.map(escapeCsv).join(";"));
  });

  const contenido = filas.join("\r\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });

  const nombreArchivoBase = comunaActual.replace(/\s+/g, "_").toLowerCase();
  const nombreArchivo = `reporte_${nombreArchivoBase}.csv`;

  if (navigator.msSaveBlob) {
    // Para IE antiguo (por si acaso)
    navigator.msSaveBlob(blob, nombreArchivo);
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }


  renderResumenComuna(datos, comuna, sesion);
  renderGraficoPersonasPorLider(datos, comuna);
  renderGraficoVotan(datos, comuna);
});
