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
    if (!raw) {
      return null;
    }
    const sesion = JSON.parse(raw);
    if (!sesion || !sesion.username || !sesion.comuna) {
      return null;
    }
    return sesion;
  } catch (e) {
    console.warn("Error cargando sesión en reportes:", e);
    return null;
  }
}

function cargarDatosReportes() {
  try {
    const raw = localStorage.getItem(LS_DATOS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch (e) {
    console.warn("Error cargando datos en reportes:", e);
    return {};
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = String(value);
  }
}

// ================================
// ✅ SEMÁFORO: COMPROMISO DEL LÍDER
// ================================
function normalizarCompromisoLider(v) {
  return (v || "")
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function badgeCompromisoLider(valor) {
  const v = normalizarCompromisoLider(valor);

  const base = `display:inline-flex; align-items:center; justify-content:center; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:900; white-space:nowrap;`;

  if (v === "comprometido") {
    return `<span style="${base} background:#dcfce7; color:#166534;">🟢 Comprometido</span>`;
  }
  if (v === "no ubicado" || v === "no_ubicado" || v === "no-ubicado") {
    return `<span style="${base} background:#fef9c3; color:#854d0e;">🟡 No ubicado</span>`;
  }
  if (v === "no apoyan" || v === "no_apoyan" || v === "no-apoyan") {
    return `<span style="${base} background:#fee2e2; color:#991b1b;">🔴 No apoyan</span>`;
  }

  return `<span style="${base} background:#e5e7eb; color:#111827;">⚪ Sin definir</span>`;
}

function renderSemaforoLideres(datos, comuna) {
  const cont = document.getElementById("rep-lideres-semaforo");
  if (!cont) return;

  const comunaData = datos[comuna] || { lideres: [] };
  const lideres = Array.isArray(comunaData.lideres) ? comunaData.lideres : [];

  if (!lideres.length) {
    cont.innerHTML = `<div class="small-text">Aún no hay líderes registrados para esta comuna.</div>`;
    return;
  }

  // Orden por nombre
  const lista = [...lideres].sort((a, b) => {
    const na = (a.nombre || "").toString().toLowerCase();
    const nb = (b.nombre || "").toString().toLowerCase();
    return na.localeCompare(nb);
  });

  cont.innerHTML = lista.map((l) => {
    const nombre = (l.nombre || "(Sin nombre)").toString();
    const doc = (l.documento || "N/D").toString();
    const tipo = (l.tipo || "N/D").toString();
    const comp = l.compromisoLider || l.compromiso || ""; // fallback por si luego lo llamas distinto

    return `
      <div style="border:1px solid #e5e7eb; border-radius:14px; padding:12px; background:#fff;">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
          <div style="display:flex; flex-direction:column; gap:3px;">
            <div style="font-weight:900;">${nombre}</div>
            <div style="font-size:12px; color:#64748b;">Doc: ${doc} · Tipo: ${tipo}</div>
          </div>
          <div>
            ${badgeCompromisoLider(comp)}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ================================
// RESUMEN GENERAL (LÍDERES / PERSONAS)
// ================================
function renderResumenComuna(datos, comuna, sesion) {
  const reportesSection = document.getElementById("reportes-section");
  const noSessionSection = document.getElementById("no-session-section");
  const titulo = document.getElementById("rep-comuna-title");
  const infoUsuario = document.getElementById("rep-user-info");

  if (!sesion) {
    if (reportesSection) {
      reportesSection.style.display = "none";
    }
    if (noSessionSection) {
      noSessionSection.style.display = "block";
    }
    return;
  }

  if (reportesSection) {
    reportesSection.style.display = "block";
  }
  if (noSessionSection) {
    noSessionSection.style.display = "none";
  }

  if (titulo) {
    titulo.textContent = comuna;
  }
  if (infoUsuario) {
    infoUsuario.textContent = "Sesión activa como: " + sesion.username;
  }

  const comunaData = datos[comuna] || { lideres: [] };
  const lideres = Array.isArray(comunaData.lideres) ? comunaData.lideres : [];

  let totalLideres = lideres.length;
  let totalPersonas = 0;
  let totalVotan = 0;

  for (let i = 0; i < lideres.length; i++) {
    const lider = lideres[i];
    const personas = Array.isArray(lider.personas) ? lider.personas : [];
    totalPersonas += personas.length;

    for (let j = 0; j < personas.length; j++) {
      const p = personas[j];
      if (p.votaTeresa) {
        totalVotan++;
      }
    }
  }

  const totalNoVotan = totalPersonas - totalVotan;

  setText("rep-total-lideres", totalLideres);
  setText("rep-total-personas", totalPersonas);
  setText("rep-total-votan", totalVotan);
  setText("rep-total-no-votan", totalNoVotan);
}

// ================================
// COMPROMISOS DE LA COMUNA
// ================================
function renderCompromisosComuna(comuna) {
  let compromisos = [];
  try {
    const raw = localStorage.getItem("pasto_compromisos") || "[]";
    compromisos = JSON.parse(raw);
    if (!Array.isArray(compromisos)) {
      compromisos = [];
    }
  } catch (e) {
    console.warn("Error cargando compromisos:", e);
    compromisos = [];
  }

  // Filtrar por comuna activa
  const lista = compromisos.filter(function (c) {
    return c.comuna === comuna;
  });

  const total = lista.length;
  const pendientes = lista.filter(function (c) {
    return c.estado === "pendiente";
  }).length;
  const gestion = lista.filter(function (c) {
    return c.estado === "gestion";
  }).length;
  const cumplidos = lista.filter(function (c) {
    return c.estado === "cumplido";
  }).length;

  setText("rep-comp-total", total);
  setText("rep-comp-pendientes", pendientes);
  setText("rep-comp-gestion", gestion);
  setText("rep-comp-cumplidos", cumplidos);

  const canvas = document.getElementById("chartCompromisos");
  if (!canvas || !window.Chart) {
    return;
  }

  // Gráfico donut pequeño de compromisos
  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Pendientes", "En gestión", "Cumplidos"],
      datasets: [
        {
          data: [pendientes, gestion, cumplidos],
          backgroundColor: ["#fbbf24", "#38bdf8", "#22c55e"]
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
// GRÁFICO: PERSONAS POR LÍDER
// ================================
function renderGraficoPersonasPorLider(datos, comuna) {
  const comunaData = datos[comuna] || { lideres: [] };
  const lideres = Array.isArray(comunaData.lideres) ? comunaData.lideres : [];

  const labels = [];
  const valores = [];

  for (let i = 0; i < lideres.length; i++) {
    const lider = lideres[i];
    labels.push(lider.nombre || "Líder " + (lider.id || ""));
    const personas = Array.isArray(lider.personas) ? lider.personas : [];
    valores.push(personas.length);
  }

  const canvas = document.getElementById("chartPersonasPorLider");
  if (!canvas || !window.Chart) {
    return;
  }

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
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

  for (let i = 0; i < lideres.length; i++) {
    const lider = lideres[i];
    const personas = Array.isArray(lider.personas) ? lider.personas : [];
    totalPersonas += personas.length;

    for (let j = 0; j < personas.length; j++) {
      const p = personas[j];
      if (p.votaTeresa) {
        totalVotan++;
      }
    }
  }

  const totalNoVotan = totalPersonas - totalVotan;

  const canvas = document.getElementById("chartVotanTeresa");
  if (!canvas || !window.Chart) {
    return;
  }

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
document.addEventListener("DOMContentLoaded", function () {
  const sesion = cargarSesionReportes();
  const reportesSection = document.getElementById("reportes-section");
  const noSessionSection = document.getElementById("no-session-section");

  if (!sesion) {
    if (reportesSection) {
      reportesSection.style.display = "none";
    }
    if (noSessionSection) {
      noSessionSection.style.display = "block";
    }
    return;
  }

  const comuna = sesion.comuna;
  const datos = cargarDatosReportes();

  // Resumen general
  renderResumenComuna(datos, comuna, sesion);

  // ✅ Semáforo líderes (NO rompe si el campo no existe)
  renderSemaforoLideres(datos, comuna);

  // Compromisos (usando localStorage "pasto_compromisos")
  renderCompromisosComuna(comuna);

  // Gráficos
  renderGraficoPersonasPorLider(datos, comuna);
  renderGraficoVotan(datos, comuna);
});
