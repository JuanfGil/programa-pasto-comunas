const LS_SESION_KEY = "pasto_sesion";
const LS_REUNIONES_KEY = "pasto_reuniones";

let reuniones = [];
let comunaActual = null;
let usuarioActual = null;
let nextReunionId = 1;

// ====== SESIÓN ====== //
function cargarSesionReu() {
  try {
    const raw = localStorage.getItem(LS_SESION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion || !sesion.username || !sesion.comuna) return null;
    return sesion;
  } catch (e) {
    console.warn("Error al cargar sesión en reuniones:", e);
    return null;
  }
}

// ====== REUNIONES LOCALSTORAGE ====== //
function cargarReuniones() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_REUNIONES_KEY) || "[]");
    if (Array.isArray(data)) {
      reuniones = data;
      if (reuniones.length > 0) {
        nextReunionId = Math.max(...reuniones.map((r) => r.id || 0)) + 1;
      }
    } else {
      reuniones = [];
    }
  } catch (e) {
    console.warn("Error al cargar reuniones:", e);
    reuniones = [];
  }
}

function guardarReuniones() {
  try {
    localStorage.setItem(LS_REUNIONES_KEY, JSON.stringify(reuniones));
  } catch (e) {
    console.warn("Error al guardar reuniones:", e);
  }
}

// ====== UI: PRIORIDAD ====== //
function normalizarPrioridad(p) {
  const v = (p || "").toString().trim().toLowerCase();
  if (v === "alta") return "Alta";
  if (v === "baja") return "Baja";
  return "Media";
}

function badgePrioridad(p) {
  const v = normalizarPrioridad(p).toLowerCase();
  const base = `display:inline-flex; padding:2px 10px; border-radius:9999px; font-size:12px; font-weight:600; white-space:nowrap;`;
  if (v === "alta") return `<span style="${base} background:#fee2e2; color:#991b1b;">Alta</span>`;
  if (v === "baja") return `<span style="${base} background:#e5e7eb; color:#111827;">Baja</span>`;
  return `<span style="${base} background:#fef9c3; color:#854d0e;">Media</span>`;
}

// ✅ NUEVO: parse número personas
function parseNumPersonas(v) {
  const s = (v ?? "").toString().trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  return Math.floor(n);
}

// ====== INICIO PÁGINA ====== //
document.addEventListener("DOMContentLoaded", () => {
  const noSessionSection = document.getElementById("no-session-section");
  const reunionesSection = document.getElementById("reuniones-section");

  const sesion = cargarSesionReu();
  if (!sesion) {
    if (noSessionSection) noSessionSection.style.display = "block";
    if (reunionesSection) reunionesSection.style.display = "none";
    return;
  }

  usuarioActual = sesion.username;
  comunaActual = sesion.comuna;

  cargarReuniones();

  const reuComunaTitle = document.getElementById("reu-comuna-title");
  const reuUserInfo = document.getElementById("reu-user-info");
  const reunionForm = document.getElementById("reunion-form");
  const tbodyReuniones = document.getElementById("tbody-reuniones");

  if (reuComunaTitle) reuComunaTitle.textContent = comunaActual;
  if (reuUserInfo) reuUserInfo.textContent = `Sesión activa como: ${usuarioActual}`;

  if (noSessionSection) noSessionSection.style.display = "none";
  if (reunionesSection) reunionesSection.style.display = "block";

  if (reunionForm) {
    reunionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!comunaActual || !usuarioActual) {
        alert("No hay comuna ni usuario activos.");
        return;
      }

      const fechaInput = document.getElementById("reunion-fecha");
      const horaInput = document.getElementById("reunion-hora");
      const lugarInput = document.getElementById("reunion-lugar");
      const tipoInput = document.getElementById("reunion-tipo");
      const prioridadInput = document.getElementById("reunion-prioridad");
      const numInput = document.getElementById("reunion-num-personas"); // ✅ NUEVO

      const fecha = (fechaInput?.value || "").trim();
      const hora = (horaInput?.value || "").trim();
      const lugar = (lugarInput?.value || "").trim();
      const tipo = (tipoInput?.value || "").trim();
      const prioridad = normalizarPrioridad(prioridadInput?.value || "Media");
      const numPersonas = parseNumPersonas(numInput?.value); // ✅ NUEVO

      if (!fecha || !hora || !lugar) {
        alert("Por favor diligencia fecha, hora y lugar.");
        return;
      }

      const nuevaReunion = {
        id: nextReunionId++,
        comuna: comunaActual,
        dinamizador: usuarioActual,
        fecha,
        hora,
        lugar,
        tipo: tipo || "Organización",
        prioridad,
        numPersonas, // ✅ NUEVO
        estado: "pendiente",
        fechaCreacion: new Date().toISOString(),
      };

      reuniones.push(nuevaReunion);
      guardarReuniones();

      if (fechaInput) fechaInput.value = "";
      if (horaInput) horaInput.value = "";
      if (lugarInput) lugarInput.value = "";
      if (tipoInput) tipoInput.value = "Motivación";
      if (prioridadInput) prioridadInput.value = "Media";
      if (numInput) numInput.value = ""; // ✅ NUEVO

      renderReuniones(tbodyReuniones);
    });
  }

  renderReuniones(tbodyReuniones);
});

// ====== RESUMEN ====== //
function actualizarResumenReuniones(reunionesComuna) {
  const totalSpan = document.getElementById("reu-total");
  const realSpan = document.getElementById("reu-realizadas");
  const pendSpan = document.getElementById("reu-pendientes");
  const cancSpan = document.getElementById("reu-canceladas");

  const total = reunionesComuna.length;
  const realizadas = reunionesComuna.filter((r) => r.estado === "realizada").length;
  const pendientes = reunionesComuna.filter((r) => r.estado === "pendiente").length;
  const canceladas = reunionesComuna.filter((r) => r.estado === "cancelada").length;

  if (totalSpan) totalSpan.textContent = total;
  if (realSpan) realSpan.textContent = realizadas;
  if (pendSpan) pendSpan.textContent = pendientes;
  if (cancSpan) cancSpan.textContent = canceladas;
}

// ====== RENDER REUNIONES ====== //
function renderReuniones(tbody) {
  if (!tbody) return;

  tbody.innerHTML = "";

  const reunionesComuna = reuniones
    .filter((r) => r.comuna === comunaActual)
    .map((r) => ({
      ...r,
      prioridad: normalizarPrioridad(r.prioridad || "Media"),
      numPersonas: (r.numPersonas === undefined ? null : r.numPersonas), // compat
    }));

  actualizarResumenReuniones(reunionesComuna);

  if (reunionesComuna.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8; // ✅ ahora son 8 columnas
    td.textContent = "Aún no hay reuniones registradas para esta comuna.";
    td.className = "small-text";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  reunionesComuna
    .sort((a, b) => {
      const fa = `${a.fecha} ${a.hora}`;
      const fb = `${b.fecha} ${b.hora}`;
      return fa.localeCompare(fb);
    })
    .forEach((reunion) => {
      const tr = document.createElement("tr");

      const tdFecha = document.createElement("td");
      tdFecha.textContent = reunion.fecha || "";

      const tdHora = document.createElement("td");
      tdHora.textContent = reunion.hora || "";

      const tdLugar = document.createElement("td");
      tdLugar.textContent = reunion.lugar || "";

      const tdTipo = document.createElement("td");
      tdTipo.textContent = reunion.tipo || "";

      const tdPrioridad = document.createElement("td");
      tdPrioridad.innerHTML = badgePrioridad(reunion.prioridad);

      // ✅ NUEVO: num personas
      const tdNum = document.createElement("td");
      tdNum.textContent =
        reunion.numPersonas === null || reunion.numPersonas === undefined
          ? "—"
          : String(reunion.numPersonas);

      // ---- Estado con pastilla de color ----
      const tdEstado = document.createElement("td");
      tdEstado.classList.add("col-estado");

      const estadoBadge = document.createElement("span");
      estadoBadge.classList.add("estado-badge");
      estadoBadge.style.display = "inline-flex";
      estadoBadge.style.alignItems = "center";
      estadoBadge.style.justifyContent = "center";
      estadoBadge.style.padding = "2px 10px";
      estadoBadge.style.borderRadius = "9999px";
      estadoBadge.style.fontSize = "12px";
      estadoBadge.style.fontWeight = "500";
      estadoBadge.style.whiteSpace = "nowrap";

      let textoEstado = "";

      if (reunion.estado === "realizada") {
        estadoBadge.style.backgroundColor = "#e6f6ec";
        estadoBadge.style.color = "#12653b";
        textoEstado = "Realizada";
      } else if (reunion.estado === "cancelada") {
        estadoBadge.style.backgroundColor = "#fde7e9";
        estadoBadge.style.color = "#b42318";
        textoEstado = "Cancelada";
      } else {
        estadoBadge.style.backgroundColor = "#fff7e0";
        estadoBadge.style.color = "#8a5a00";
        textoEstado = "Pendiente";
      }

      estadoBadge.textContent = textoEstado;
      tdEstado.appendChild(estadoBadge);

      // ---- Acciones ----
      const tdAcciones = document.createElement("td");
      tdAcciones.classList.add("col-acciones");

      const contBtns = document.createElement("div");
      contBtns.className = "reuniones-acciones";
      contBtns.style.display = "flex";
      contBtns.style.flexDirection = "column";
      contBtns.style.alignItems = "flex-start";
      contBtns.style.gap = "6px";

      const btnPendiente = document.createElement("button");
      btnPendiente.textContent = "Pendiente";
      btnPendiente.className = "btn-secondary";
      btnPendiente.style.fontSize = "11px";
      btnPendiente.style.padding = "3px 10px";
      btnPendiente.addEventListener("click", () =>
        actualizarEstadoReunion(reunion.id, "pendiente", tbody)
      );

      const btnRealizada = document.createElement("button");
      btnRealizada.textContent = "Realizada";
      btnRealizada.className = "btn-secondary";
      btnRealizada.style.fontSize = "11px";
      btnRealizada.style.padding = "3px 10px";
      btnRealizada.addEventListener("click", () =>
        actualizarEstadoReunion(reunion.id, "realizada", tbody)
      );

      const btnCancelada = document.createElement("button");
      btnCancelada.textContent = "Cancelada";
      btnCancelada.className = "btn-secondary";
      btnCancelada.style.fontSize = "11px";
      btnCancelada.style.padding = "3px 10px";
      btnCancelada.addEventListener("click", () =>
        actualizarEstadoReunion(reunion.id, "cancelada", tbody)
      );

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.className = "btn-secondary";
      btnEliminar.style.fontSize = "11px";
      btnEliminar.style.padding = "3px 10px";
      btnEliminar.addEventListener("click", () =>
        eliminarReunion(reunion.id, tbody)
      );

      contBtns.appendChild(btnPendiente);
      contBtns.appendChild(btnRealizada);
      contBtns.appendChild(btnCancelada);
      contBtns.appendChild(btnEliminar);
      tdAcciones.appendChild(contBtns);

      tr.appendChild(tdFecha);
      tr.appendChild(tdHora);
      tr.appendChild(tdLugar);
      tr.appendChild(tdTipo);
      tr.appendChild(tdPrioridad);
      tr.appendChild(tdNum); // ✅ NUEVO
      tr.appendChild(tdEstado);
      tr.appendChild(tdAcciones);

      tbody.appendChild(tr);
    });
}

// ====== ACCIONES SOBRE REUNIONES ====== //
function actualizarEstadoReunion(id, nuevoEstado, tbody) {
  const r = reuniones.find((x) => x.id === id);
  if (!r) return;
  r.estado = nuevoEstado;
  guardarReuniones();
  renderReuniones(tbody);
}

function eliminarReunion(id, tbody) {
  if (!confirm("¿Seguro que deseas eliminar esta reunión?")) return;
  reuniones = reuniones.filter((r) => r.id !== id);
  guardarReuniones();
  renderReuniones(tbody);
}
