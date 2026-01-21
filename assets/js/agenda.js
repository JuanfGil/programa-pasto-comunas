// ================================
// AGENDA.JS
// ================================
function agGetSesion() {
  try {
    return JSON.parse(localStorage.getItem("pasto_sesion") || "null");
  } catch {
    return null;
  }
}

function agSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function agNormalizarEstado(estado) {
  return (estado || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function agCargarReuniones() {
  // Ajusta la key si tu reuniones.html usa otra
  const keysPosibles = ["pasto_reuniones", "reuniones", "pasto_meetings"];
  for (const k of keysPosibles) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function agParseFechaHora(item) {
  // Intentamos armar un Date con lo que exista
  // formatos típicos:
  // item.fecha = "2026-01-22", item.hora = "23:10"
  // o item.fechaHora = "2026-01-22T23:10"
  const f = (item.fecha || "").toString().trim();
  const h = (item.hora || "").toString().trim();
  const fh = (item.fechaHora || item.datetime || "").toString().trim();

  if (fh) {
    const d = new Date(fh);
    if (!isNaN(d.getTime())) return d;
  }

  if (f && h) {
    const d = new Date(`${f}T${h}`);
    if (!isNaN(d.getTime())) return d;
  }

  if (f) {
    const d = new Date(`${f}T00:00`);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date(0); // al final
}

function agFiltrarPorComuna(reuniones, comuna) {
  const ref = (comuna || "").toString().toLowerCase().trim();
  return reuniones.filter((r) => {
    const c = (r.comuna || "").toString().toLowerCase().trim();
    return c === ref;
  });
}

function agRenderResumen(lista) {
  const total = lista.length;
  const pend = lista.filter(r => agNormalizarEstado(r.estado) === "pendiente").length;
  const real = lista.filter(r => agNormalizarEstado(r.estado) === "realizada").length;
  const canc = lista.filter(r => agNormalizarEstado(r.estado) === "cancelada").length;

  agSetText("ag-total", total);
  agSetText("ag-pend", pend);
  agSetText("ag-real", real);
  agSetText("ag-canc", canc);
}

function agBadgeEstado(estado) {
  const est = agNormalizarEstado(estado);
  const base = `display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:600;`;

  if (est === "realizada") return `<span style="${base} background:#dcfce7; color:#166534;">Realizada</span>`;
  if (est === "cancelada") return `<span style="${base} background:#fee2e2; color:#991b1b;">Cancelada</span>`;
  return `<span style="${base} background:#fef9c3; color:#854d0e;">Pendiente</span>`;
}

function agCard(item) {
  const fecha = (item.fecha || "").toString().trim();
  const hora = (item.hora || "").toString().trim();
  const lugar = (item.lugar || "").toString().trim();
  const tipo = (item.tipo || "").toString().trim();
  const estado = item.estado || "Pendiente";

  return `
    <div style="border:1px solid #e5e7eb; border-radius:14px; padding:14px; background:#fff;">
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <div style="font-weight:800;">${tipo || "Reunión"}</div>
          ${agBadgeEstado(estado)}
        </div>
        <div style="color:#6b7280; font-size:13px;">
          ${fecha || "Sin fecha"} ${hora ? "• " + hora : ""}
        </div>
      </div>

      <div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <div style="font-size:12px; color:#6b7280;">Lugar</div>
          <div style="font-weight:600;">${lugar || "No especificado"}</div>
        </div>
        <div>
          <div style="font-size:12px; color:#6b7280;">Comuna</div>
          <div style="font-weight:600;">${item.comuna || "—"}</div>
        </div>
      </div>
    </div>
  `;
}

function agRenderLista(lista) {
  const cont = document.getElementById("agenda-list");
  if (!cont) return;

  if (!lista.length) {
    cont.innerHTML = `<div class="small-text">No hay reuniones registradas para esta comuna.</div>`;
    return;
  }

  cont.innerHTML = lista.map(agCard).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const sesion = agGetSesion();
  const noSession = document.getElementById("no-session-section");
  const agendaSection = document.getElementById("agenda-section");

  if (!sesion || !sesion.username) {
    if (agendaSection) agendaSection.style.display = "none";
    if (noSession) noSession.style.display = "block";
    return;
  }

  if (noSession) noSession.style.display = "none";
  if (agendaSection) agendaSection.style.display = "block";

  const comuna = sesion.comuna || "Comuna 1";
  const title = document.getElementById("agenda-comuna-title");
  const info = document.getElementById("agenda-user-info");
  if (title) title.textContent = comuna;
  if (info) info.textContent = `Sesión activa como: ${sesion.username}`;

  const all = agCargarReuniones();
  let lista = agFiltrarPorComuna(all, comuna);

  // Orden por fecha/hora
  lista.sort((a, b) => agParseFechaHora(a) - agParseFechaHora(b));

  // Render inicial
  agRenderResumen(lista);
  agRenderLista(lista);

  // Filtros
  const filtroEstado = document.getElementById("ag-filter-estado");
  const search = document.getElementById("ag-search");

  function aplicarFiltros() {
    const est = (filtroEstado?.value || "todas").toLowerCase();
    const q = (search?.value || "").toLowerCase().trim();

    let filtrada = [...lista];

    if (est !== "todas") {
      filtrada = filtrada.filter(r => agNormalizarEstado(r.estado) === est);
    }

    if (q) {
      filtrada = filtrada.filter(r => {
        const lugar = (r.lugar || "").toString().toLowerCase();
        const tipo = (r.tipo || "").toString().toLowerCase();
        return lugar.includes(q) || tipo.includes(q);
      });
    }

    agRenderResumen(filtrada);
    agRenderLista(filtrada);
  }

  if (filtroEstado) filtroEstado.addEventListener("change", aplicarFiltros);
  if (search) search.addEventListener("input", aplicarFiltros);
});
