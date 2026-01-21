// ================================
// CONFIGURACIÓN
// ================================
const PG_LS_SESION_KEY = "pasto_sesion";
const PG_LS_DATOS_KEY = "pasto_datos";

// ================================
// HELPERS LOCALSTORAGE
// ================================
function pgCargarSesion() {
  try {
    const raw = localStorage.getItem(PG_LS_SESION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion || !sesion.username) return null;
    return sesion;
  } catch {
    return null;
  }
}

function pgCargarDatos() {
  try {
    const raw = localStorage.getItem(PG_LS_DATOS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function pgCargarCompromisos() {
  try {
    const raw = localStorage.getItem("pasto_compromisos") || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pgSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

// ================================
// AGRUPAR INFORMACIÓN POR COMUNA
// ================================
function pgConstruirResumenPorComuna() {
  const datos = pgCargarDatos();
  const compromisos = pgCargarCompromisos();

  // Mapa por comuna
  const mapa = {}; // { comuna: { lideres, personas, votan, compromisosTotal, pend, gest, cump } }

  // 1) Información de líderes / personas (pasto_datos)
  Object.keys(datos).forEach((comuna) => {
    const comunaData = datos[comuna] || { lideres: [] };
    const lideres = Array.isArray(comunaData.lideres) ? comunaData.lideres : [];

    if (!mapa[comuna]) {
      mapa[comuna] = {
        comuna,
        lideres: 0,
        personas: 0,
        votan: 0,
        compromisosTotal: 0,
        pend: 0,
        gest: 0,
        cump: 0,
      };
    }

    mapa[comuna].lideres += lideres.length;

    lideres.forEach((lider) => {
      const personas = Array.isArray(lider.personas) ? lider.personas : [];
      mapa[comuna].personas += personas.length;
      personas.forEach((p) => {
        if (p.votaTeresa) mapa[comuna].votan++;
      });
    });
  });

  // 2) Información de compromisos (pasto_compromisos)
  compromisos.forEach((c) => {
    const comunaRaw = (c.comuna || "").toString().trim();
    if (!comunaRaw) return;

    const comuna = comunaRaw; // usamos tal cual lo guardaste

    if (!mapa[comuna]) {
      // comuna con compromisos pero sin líderes/personas todavía
      mapa[comuna] = {
        comuna,
        lideres: 0,
        personas: 0,
        votan: 0,
        compromisosTotal: 0,
        pend: 0,
        gest: 0,
        cump: 0,
      };
    }

    const est = (c.estado || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    mapa[comuna].compromisosTotal++;

    if (est === "pendiente") {
      mapa[comuna].pend++;
    } else if (est === "gestion" || est === "en gestion") {
      mapa[comuna].gest++;
    } else if (est === "cumplido" || est === "cumplidos") {
      mapa[comuna].cump++;
    }
  });

  return mapa;
}

// ================================
// RENDER TABLA Y RESUMEN GLOBAL
// ================================
function pgRenderTablaYResumen(mapa) {
  const tbody = document.getElementById("pg-tbody-comunas");
  if (!tbody) return;

  tbody.innerHTML = "";

  const comunas = Object.keys(mapa).sort();
  let totalLideres = 0;
  let totalPersonas = 0;
  let totalCompromisos = 0;

  comunas.forEach((comuna) => {
    const info = mapa[comuna];
    totalLideres += info.lideres;
    totalPersonas += info.personas;
    totalCompromisos += info.compromisosTotal;

    const porcentaje =
      info.personas > 0 ? ((info.votan / info.personas) * 100).toFixed(1) + "%" : "0%";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${info.comuna}</td>
      <td>${info.lideres}</td>
      <td>${info.personas}</td>
      <td>${info.votan}</td>
      <td>${porcentaje}</td>
      <td>${info.compromisosTotal}</td>
      <td>${info.pend}</td>
      <td>${info.gest}</td>
      <td>${info.cump}</td>
    `;

    tbody.appendChild(tr);
  });

  pgSetText("pg-total-comunas", comunas.length);
  pgSetText("pg-total-lideres", totalLideres);
  pgSetText("pg-total-personas", totalPersonas);
  pgSetText("pg-total-compromisos", totalCompromisos);
}

// ================================
// GRÁFICO: PERSONAS POR COMUNA
// ================================
function pgRenderGraficoPersonas(mapa) {
  const canvas = document.getElementById("pg-chart-personas");
  if (!canvas || !window.Chart) return;

  const comunas = Object.keys(mapa).sort();
  const valores = comunas.map((c) => mapa[c].personas);

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: comunas,
      datasets: [
        {
          label: "Personas vinculadas",
          data: valores,
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
      maintainAspectRatio: true,
    },
  });
}

// ================================
// GRÁFICO: COMPROMISOS POR COMUNA
// ================================
function pgRenderGraficoCompromisos(mapa) {
  const canvas = document.getElementById("pg-chart-compromisos");
  if (!canvas || !window.Chart) return;

  const comunas = Object.keys(mapa).sort();
  const valores = comunas.map((c) => mapa[c].compromisosTotal);

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: comunas,
      datasets: [
        {
          label: "Compromisos",
          data: valores,
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
      maintainAspectRatio: true,
    },
  });
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const sesion = pgCargarSesion();
  const panelSection = document.getElementById("panel-section");
  const noSessionSection = document.getElementById("no-session-section");

  if (!sesion) {
    if (panelSection) panelSection.style.display = "none";
    if (noSessionSection) noSessionSection.style.display = "block";
    return;
  }

  if (panelSection) panelSection.style.display = "block";
  if (noSessionSection) noSessionSection.style.display = "none";

  const mapa = pgConstruirResumenPorComuna();

  pgRenderTablaYResumen(mapa);
  pgRenderGraficoPersonas(mapa);
  pgRenderGraficoCompromisos(mapa);
});
