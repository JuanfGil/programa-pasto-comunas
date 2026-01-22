// ======================================
// COMPROMISOS.JS (compatible + aprobación)
// ======================================

const LS_SESION = "pasto_sesion";
const LS_DATOS = "pasto_datos";
const LS_REUNIONES = "pasto_reuniones";
const LS_COMPROMISOS = "pasto_compromisos";

function safeJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function norm(s) { return (s || "").toString().trim(); }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = String(v); }
function id(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`; }

function getSesion() { return safeJSON(LS_SESION, null); }
function getDatos() {
  const d = safeJSON(LS_DATOS, {});
  return (d && typeof d === "object") ? d : {};
}
function getReuniones() {
  const arr = safeJSON(LS_REUNIONES, []);
  return Array.isArray(arr) ? arr : [];
}
function getCompromisos() {
  const arr = safeJSON(LS_COMPROMISOS, []);
  return Array.isArray(arr) ? arr : [];
}
function saveCompromisos(arr) { localStorage.setItem(LS_COMPROMISOS, JSON.stringify(arr)); }

function comunaActiva(sesion, datos) {
  if (sesion?.comuna && sesion.comuna !== "ALL") return sesion.comuna;
  const keys = Object.keys(datos || {});
  return keys[0] || "Comuna 1";
}

function reunionKey(r) {
  const f = norm(r.fecha);
  const h = norm(r.hora);
  const l = norm(r.lugar).toLowerCase();
  const t = norm(r.tipo).toLowerCase();
  return `${f}|${h}|${l}|${t}`;
}

function cargarLideresDeComuna(comuna) {
  const datos = getDatos();
  const comunaData = datos[comuna] || { lideres: [] };
  const lideres = Array.isArray(comunaData.lideres) ? comunaData.lideres : [];
  return lideres.map(l => ({ id: l.id || "", nombre: l.nombre || "" }));
}

function poblarSelectLider(comuna) {
  const select = document.getElementById("comp-lider");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccione un líder</option>`;
  const lideres = cargarLideresDeComuna(comuna)
    .filter(l => norm(l.nombre))
    .sort((a,b) => a.nombre.localeCompare(b.nombre));

  lideres.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.id ? `id:${l.id}` : `name:${l.nombre}`;
    opt.textContent = l.nombre;
    select.appendChild(opt);
  });
}

function poblarSelectReunion(comuna, liderKeyValue) {
  const select = document.getElementById("comp-reunion");
  if (!select) return;

  const reuniones = getReuniones().filter(r => norm(r.comuna) === norm(comuna));

  let liderNombre = "";
  if (liderKeyValue?.startsWith("name:")) liderNombre = liderKeyValue.slice(5);
  if (liderKeyValue?.startsWith("id:")) {
    const idVal = liderKeyValue.slice(3);
    liderNombre = cargarLideresDeComuna(comuna).find(l => l.id === idVal)?.nombre || "";
  }

  const filtradas = liderNombre
    ? reuniones.filter(r => norm(r.liderNombre || r.lider || "").toLowerCase().includes(liderNombre.toLowerCase()))
    : reuniones;

  filtradas.sort((a,b) => {
    const da = new Date(`${a.fecha || "1970-01-01"}T${a.hora || "00:00"}`);
    const db = new Date(`${b.fecha || "1970-01-01"}T${b.hora || "00:00"}`);
    return da - db;
  });

  select.innerHTML = `<option value="">Sin reunión</option>`;
  filtradas.forEach(r => {
    const opt = document.createElement("option");
    opt.value = reunionKey(r);
    opt.textContent = `${r.fecha || ""} ${r.hora || ""} • ${r.tipo || "Reunión"} • ${r.lugar || ""}`;
    select.appendChild(opt);
  });
}

function badgePrioridad(p) {
  const v = (p || "").toLowerCase();
  const base = `display:inline-flex; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:900;`;
  if (v === "alta") return `<span style="${base} background:#fee2e2; color:#991b1b;">Alta</span>`;
  if (v === "media") return `<span style="${base} background:#fef9c3; color:#854d0e;">Media</span>`;
  return `<span style="${base} background:#e5e7eb; color:#111827;">Baja</span>`;
}

function badgeEstado(e) {
  const v = (e || "").toLowerCase();
  const base = `display:inline-flex; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:900;`;
  if (v.includes("cumpl")) return `<span style="${base} background:#dcfce7; color:#166534;">Cumplido</span>`;
  if (v.includes("gestion")) return `<span style="${base} background:#dbeafe; color:#1e40af;">En gestión</span>`;
  return `<span style="${base} background:#fef9c3; color:#854d0e;">Pendiente</span>`;
}

function resolverReunionTextoPorKey(comuna, rKey) {
  if (!rKey) return "—";
  const reuniones = getReuniones().filter(r => norm(r.comuna) === norm(comuna));
  const r = reuniones.find(x => reunionKey(x) === rKey);
  if (!r) return "—";
  return `${r.fecha || ""} ${r.hora || ""} • ${r.tipo || "Reunión"}`;
}

function normalizarCompromiso(c) {
  return {
    id: c.id || id("c"),
    comuna: c.comuna || "",
    liderKey: c.liderKey || "",
    liderNombre: c.liderNombre || c.lider || "",
    reunionKey: c.reunionKey || "",
    tipoCompromiso: c.tipoCompromiso || c.tipo || "",
    estado: c.estado || "Pendiente",
    prioridad: c.prioridad || "Media",
    fecha: c.fecha || "",

    // ✅ NUEVO: aprobación
    aprobado: typeof c.aprobado === "boolean" ? c.aprobado : false,
    aprobadoPor: c.aprobadoPor || "",
    aprobadoFecha: c.aprobadoFecha || ""
  };
}

function canApprove(rol) {
  const r = (rol || "").toLowerCase();
  // ✅ solo Gerencia o Coordinador (y Admin para no bloquear)
  return r === "gerencia" || r === "coordinador" || r === "admin";
}

function renderTabla(comuna, sesion) {
  const tbody = document.getElementById("comp-tbody");
  if (!tbody) return;

  const rol = (sesion?.rol || "").toLowerCase();
  const puedeAprobar = canApprove(rol);

  let all = getCompromisos().map(normalizarCompromiso);

  // Si usuario es full (ALL), muestra todos; si no, solo su comuna
  const isAll = (sesion?.comuna === "ALL");
  const compromisos = isAll ? all : all.filter(c => norm(c.comuna) === norm(comuna));

  compromisos.sort((a,b) => (b.fecha || "").localeCompare(a.fecha || ""));

  if (!compromisos.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="small-text">No hay compromisos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = compromisos.map(c => {
    const reunionTxt = resolverReunionTextoPorKey(c.comuna || comuna, c.reunionKey);
    const checked = c.aprobado ? "checked" : "";
    const disabled = puedeAprobar ? "" : "disabled";

    return `
      <tr>
        <td>${norm(c.fecha) || "—"}</td>
        <td>${norm(c.liderNombre) || "—"}</td>
        <td>${reunionTxt}</td>
        <td>${norm(c.tipoCompromiso) || "—"}</td>
        <td>${badgePrioridad(c.prioridad)}</td>
        <td>${badgeEstado(c.estado)}</td>
        <td style="text-align:center;">
          <input type="checkbox"
            data-comp-id="${c.id}"
            ${checked}
            ${disabled}
            title="${c.aprobado ? `Aprobado por: ${c.aprobadoPor || "—"}` : "No aprobado"}"
          />
        </td>
      </tr>
    `;
  }).join("");

  // ✅ Listener para aprobar (solo roles autorizados)
  tbody.querySelectorAll('input[type="checkbox"][data-comp-id]').forEach(chk => {
    chk.addEventListener("change", (e) => {
      if (!puedeAprobar) return;

      const compId = e.target.getAttribute("data-comp-id");
      const nuevoValor = !!e.target.checked;

      let arr = getCompromisos().map(normalizarCompromiso);
      const idx = arr.findIndex(x => x.id === compId);
      if (idx === -1) return;

      arr[idx].aprobado = nuevoValor;
      arr[idx].aprobadoPor = nuevoValor ? (sesion.username || "") : "";
      arr[idx].aprobadoFecha = nuevoValor ? new Date().toISOString() : "";

      saveCompromisos(arr);

      // re-render para actualizar tooltips
      renderTabla(comuna, sesion);
    });
  });
}

function exportExcel(sesion, comuna) {
  const all = getCompromisos().map(normalizarCompromiso);
  const isAll = (sesion?.comuna === "ALL");
  const data = isAll ? all : all.filter(c => norm(c.comuna) === norm(comuna));

  const rows = data.map(c => ({
    Comuna: c.comuna || "",
    Fecha: c.fecha || "",
    "Líder/Contacto": c.liderNombre || "",
    "Tipo de compromiso": c.tipoCompromiso || "",
    Estado: c.estado || "",
    Prioridad: c.prioridad || "",
    "Reunión": resolverReunionTextoPorKey(c.comuna || comuna, c.reunionKey),
    Aprobado: c.aprobado ? "SI" : "NO",
    "Aprobado por": c.aprobadoPor || "",
    "Aprobado fecha": c.aprobadoFecha || ""
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Compromisos");
  XLSX.writeFile(wb, `Compromisos_${(isAll ? "TODAS" : comuna).replace(/\s+/g, "_")}.xlsx`);
}

document.addEventListener("DOMContentLoaded", () => {
  const sesion = getSesion();
  const noSes = document.getElementById("no-session-section");
  const sec = document.getElementById("compromisos-section");

  if (!sesion?.username) {
    if (sec) sec.style.display = "none";
    if (noSes) noSes.style.display = "block";
    return;
  }

  if (noSes) noSes.style.display = "none";
  if (sec) sec.style.display = "block";

  const datos = getDatos();
  const comuna = comunaActiva(sesion, datos);

  setText("comp-comuna-title", sesion.comuna === "ALL" ? "TODAS LAS COMUNAS" : comuna);
  setText("comp-user-info", `Sesión activa como: ${sesion.username} (${sesion.rol})`);

  // Selects (si ALL, usamos primera comuna para cargar líderes/reuniones en formulario)
  const comunaForm = (sesion.comuna === "ALL") ? comuna : comuna;

  poblarSelectLider(comunaForm);
  poblarSelectReunion(comunaForm, "");

  const selLider = document.getElementById("comp-lider");
  selLider?.addEventListener("change", () => {
    poblarSelectReunion(comunaForm, selLider.value || "");
  });

  renderTabla(comuna, sesion);

  document.getElementById("comp-form")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const liderKey = norm(document.getElementById("comp-lider")?.value);
    const reunionKeySel = norm(document.getElementById("comp-reunion")?.value);
    const tipoCompromiso = norm(document.getElementById("comp-tipo")?.value);
    const estado = norm(document.getElementById("comp-estado")?.value) || "Pendiente";
    const prioridad = norm(document.getElementById("comp-prioridad")?.value) || "Media";
    const fecha = norm(document.getElementById("comp-fecha")?.value);

    if (!liderKey || !tipoCompromiso || !estado || !prioridad || !fecha) return;

    const liderNombre = (function () {
      if (liderKey.startsWith("name:")) return liderKey.slice(5);
      if (liderKey.startsWith("id:")) {
        const idVal = liderKey.slice(3);
        const lideres = cargarLideresDeComuna(comunaForm);
        return lideres.find(l => l.id === idVal)?.nombre || "";
      }
      return "";
    })();

    const comp = {
      id: id("c"),
      comuna: comunaForm,
      liderKey,
      liderNombre: liderNombre || "Contacto",
      reunionKey: reunionKeySel || "",
      tipoCompromiso,
      estado,
      prioridad,
      fecha,
      aprobado: false,
      aprobadoPor: "",
      aprobadoFecha: ""
    };

    const arr = getCompromisos();
    arr.push(comp);
    saveCompromisos(arr);

    e.target.reset();
    poblarSelectLider(comunaForm);
    poblarSelectReunion(comunaForm, "");
    renderTabla(comuna, sesion);
  });

  document.getElementById("btn-export-excel")?.addEventListener("click", () => {
    exportExcel(sesion, comuna);
  });
});
