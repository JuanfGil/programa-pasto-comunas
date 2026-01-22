// ======================================
// COMPROMISOS.JS (compatible / sin romper)
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

function norm(s) {
  return (s || "").toString().trim();
}

function getSesion() {
  return safeJSON(LS_SESION, null);
}

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

function saveCompromisos(arr) {
  localStorage.setItem(LS_COMPROMISOS, JSON.stringify(arr));
}

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(v);
}

function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function comunaActiva(sesion, datos) {
  if (sesion?.comuna) return sesion.comuna;
  const keys = Object.keys(datos || {});
  return keys[0] || "Comuna 1";
}

// ✅ Creamos un "reunionKey" estable sin modificar reuniones existentes
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

  // No forzamos cambios, solo leemos
  return lideres.map(l => ({
    id: l.id || "",             // si existe, bien; si no, igual sirve por nombre
    nombre: l.nombre || ""
  }));
}

function poblarSelectLider(comuna) {
  const select = document.getElementById("comp-lider");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccione un líder</option>`;

  const lideres = cargarLideresDeComuna(comuna);
  lideres
    .filter(l => norm(l.nombre))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .forEach(l => {
      const opt = document.createElement("option");
      // Usamos ID si existe; si no, usamos el nombre como "key" (compatibilidad)
      opt.value = l.id ? `id:${l.id}` : `name:${l.nombre}`;
      opt.textContent = l.nombre;
      select.appendChild(opt);
    });
}

function poblarSelectReunion(comuna, liderKeyValue) {
  const select = document.getElementById("comp-reunion");
  if (!select) return;

  const reuniones = getReuniones().filter(r => norm(r.comuna) === norm(comuna));

  // Si tus reuniones ya guardan algo del líder, intentamos filtrar por coincidencia de nombre
  // (sin asumir que existe liderId)
  let liderNombre = "";
  if (liderKeyValue?.startsWith("name:")) liderNombre = liderKeyValue.slice(5);
  if (liderKeyValue?.startsWith("id:")) {
    // si es id, igual intentamos buscar el nombre para filtro "suave"
    const idVal = liderKeyValue.slice(3);
    const lideres = cargarLideresDeComuna(comuna);
    liderNombre = lideres.find(l => l.id === idVal)?.nombre || "";
  }

  const filtradas = liderNombre
    ? reuniones.filter(r => {
        const ln = norm(r.liderNombre || r.lider || "").toLowerCase();
        return ln.includes(liderNombre.toLowerCase());
      })
    : reuniones;

  filtradas.sort((a, b) => {
    const da = new Date(`${a.fecha || "1970-01-01"}T${a.hora || "00:00"}`);
    const db = new Date(`${b.fecha || "1970-01-01"}T${b.hora || "00:00"}`);
    return da - db;
  });

  select.innerHTML = `<option value="">Sin reunión</option>`;
  filtradas.forEach(r => {
    const key = reunionKey(r);
    const opt = document.createElement("option");
    opt.value = key; // guardaremos reunionKey en el compromiso
    opt.textContent = `${r.fecha || ""} ${r.hora || ""} • ${r.tipo || "Reunión"} • ${r.lugar || ""}`;
    select.appendChild(opt);
  });
}

function badgePrioridad(p) {
  const v = (p || "").toString().toLowerCase();
  const base = `display:inline-flex; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:900;`;
  if (v === "alta") return `<span style="${base} background:#fee2e2; color:#991b1b;">Alta</span>`;
  if (v === "media") return `<span style="${base} background:#fef9c3; color:#854d0e;">Media</span>`;
  return `<span style="${base} background:#e5e7eb; color:#111827;">Baja</span>`;
}

function badgeEstado(e) {
  const v = (e || "").toString().toLowerCase();
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
  // ✅ Compatibilidad con registros viejos
  return {
    id: c.id || id("c"),
    comuna: c.comuna || "",
    liderKey: c.liderKey || "",                 // nuevo
    liderNombre: c.liderNombre || c.lider || "",// viejo -> nuevo
    reunionKey: c.reunionKey || "",             // nuevo
    tipoCompromiso: c.tipoCompromiso || c.tipo || "",
    estado: c.estado || "Pendiente",
    prioridad: c.prioridad || "Media",
    fecha: c.fecha || ""
  };
}

function renderTabla(comuna) {
  const tbody = document.getElementById("comp-tbody");
  if (!tbody) return;

  const compromisos = getCompromisos()
    .map(normalizarCompromiso)
    .filter(c => norm(c.comuna) === norm(comuna));

  // guardamos normalizados (para evitar futuros nulls) SIN romper
  saveCompromisos(compromisos.concat(
    getCompromisos().map(normalizarCompromiso).filter(x => norm(x.comuna) !== norm(comuna))
  ));

  compromisos.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  if (!compromisos.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="small-text">No hay compromisos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = compromisos.map(c => {
    const reunionTxt = resolverReunionTextoPorKey(comuna, c.reunionKey);
    return `
      <tr>
        <td>${norm(c.fecha) || "—"}</td>
        <td>${norm(c.liderNombre) || "—"}</td>
        <td>${reunionTxt}</td>
        <td>${norm(c.tipoCompromiso) || "—"}</td>
        <td>${badgePrioridad(c.prioridad)}</td>
        <td>${badgeEstado(c.estado)}</td>
      </tr>
    `;
  }).join("");
}

function exportExcel(comuna) {
  const compromisos = getCompromisos()
    .map(normalizarCompromiso)
    .filter(c => norm(c.comuna) === norm(comuna));

  const rows = compromisos.map(c => ({
    Comuna: c.comuna || "",
    Fecha: c.fecha || "",
    "Líder/Contacto": c.liderNombre || "",
    "Tipo de compromiso": c.tipoCompromiso || "",
    Estado: c.estado || "",
    Prioridad: c.prioridad || "",
    "Reunión": resolverReunionTextoPorKey(comuna, c.reunionKey)
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Compromisos");
  XLSX.writeFile(wb, `Compromisos_${(comuna || "Comuna").replace(/\s+/g, "_")}.xlsx`);
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

  setText("comp-comuna-title", comuna);
  setText("comp-user-info", `Sesión activa como: ${sesion.username}`);

  // Selects
  poblarSelectLider(comuna);
  poblarSelectReunion(comuna, "");

  const selLider = document.getElementById("comp-lider");
  selLider?.addEventListener("change", () => {
    poblarSelectReunion(comuna, selLider.value || "");
  });

  // Render inicial
  renderTabla(comuna);

  // Guardar
  const form = document.getElementById("comp-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const liderKey = norm(document.getElementById("comp-lider")?.value);
    const reunionKeySel = norm(document.getElementById("comp-reunion")?.value);
    const tipoCompromiso = norm(document.getElementById("comp-tipo")?.value);
    const estado = norm(document.getElementById("comp-estado")?.value) || "Pendiente";
    const prioridad = norm(document.getElementById("comp-prioridad")?.value) || "Media";
    const fecha = norm(document.getElementById("comp-fecha")?.value);

    if (!liderKey || !tipoCompromiso || !estado || !prioridad || !fecha) return;

    // resolver nombre del líder a partir del select
    const liderNombre = (function () {
      if (liderKey.startsWith("name:")) return liderKey.slice(5);
      if (liderKey.startsWith("id:")) {
        const idVal = liderKey.slice(3);
        const lideres = cargarLideresDeComuna(comuna);
        return lideres.find(l => l.id === idVal)?.nombre || "";
      }
      return "";
    })();

    const comp = {
      id: id("c"),
      comuna,
      liderKey,                 // nuevo
      liderNombre: liderNombre || "Contacto",
      reunionKey: reunionKeySel || "", // nuevo
      tipoCompromiso,
      estado,
      prioridad,
      fecha
    };

    const arr = getCompromisos();
    arr.push(comp);
    saveCompromisos(arr);

    form.reset();
    poblarSelectLider(comuna);
    poblarSelectReunion(comuna, "");
    renderTabla(comuna);
  });

  // Export
  document.getElementById("btn-export-excel")?.addEventListener("click", () => {
    exportExcel(comuna);
  });
});
