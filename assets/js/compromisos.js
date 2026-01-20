const LS_SESION_KEY = "pasto_sesion";
const LS_COMPROMISOS_KEY = "pasto_compromisos";

let compromisos = [];
let comunaCompActual = null;
let usuarioCompActual = null;
let nextCompId = 1;

// ====== SESIÓN ====== //
function cargarSesionComp() {
  try {
    const raw = localStorage.getItem(LS_SESION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion || !sesion.username || !sesion.comuna) return null;
    return sesion;
  } catch (e) {
    console.warn("Error al cargar sesión en compromisos:", e);
    return null;
  }
}

// ====== COMPROMISOS LOCALSTORAGE ====== //
function cargarCompromisos() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_COMPROMISOS_KEY) || "[]");
    if (Array.isArray(data)) {
      compromisos = data;
      if (compromisos.length > 0) {
        nextCompId = Math.max(...compromisos.map((c) => c.id || 0)) + 1;
      }
    } else {
      compromisos = [];
    }
  } catch (e) {
    console.warn("Error al cargar compromisos:", e);
    compromisos = [];
  }
}

function guardarCompromisos() {
  try {
    localStorage.setItem(LS_COMPROMISOS_KEY, JSON.stringify(compromisos));
  } catch (e) {
    console.warn("Error al guardar compromisos:", e);
  }
}

// ====== INICIO PÁGINA ====== //
document.addEventListener("DOMContentLoaded", () => {
  const noSessionSection = document.getElementById("no-session-section");
  const compromisosSection = document.getElementById("compromisos-section");

  const sesion = cargarSesionComp();
  if (!sesion) {
    if (noSessionSection) noSessionSection.style.display = "block";
    if (compromisosSection) compromisosSection.style.display = "none";
    return;
  }

  usuarioCompActual = sesion.username;
  comunaCompActual = sesion.comuna;

  cargarCompromisos();

  const compComunaTitle = document.getElementById("comp-comuna-title");
  const compUserInfo = document.getElementById("comp-user-info");
  const form = document.getElementById("compromiso-form");
  const tbody = document.getElementById("tbody-compromisos");

  if (compComunaTitle) compComunaTitle.textContent = comunaCompActual;
  if (compUserInfo) compUserInfo.textContent = `Sesión activa como: ${usuarioCompActual}`;

  if (noSessionSection) noSessionSection.style.display = "none";
  if (compromisosSection) compromisosSection.style.display = "block";

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const descInput = document.getElementById("comp-descripcion");
      const tipoInput = document.getElementById("comp-tipo");
      const estadoInput = document.getElementById("comp-estado");

      const descripcion = (descInput.value || "").trim();
      const tipo = (tipoInput.value || "").trim();
      const estado = (estadoInput.value || "").trim();

      if (!descripcion) {
        alert("Por favor escribe la descripción del compromiso.");
        return;
      }

      const nuevoCompromiso = {
        id: nextCompId++,
        comuna: comunaCompActual,
        dinamizador: usuarioCompActual,
        descripcion,
        tipo: tipo || "Otro",
        estado: estado || "pendiente",
        fechaCreacion: new Date().toISOString(),
      };

      compromisos.push(nuevoCompromiso);
      guardarCompromisos();

      descInput.value = "";
      tipoInput.value = "Infraestructura";
      estadoInput.value = "pendiente";

      renderCompromisos(tbody);
    });
  }

  renderCompromisos(tbody);
});

// ====== RESUMEN ====== //
function actualizarResumenCompromisos(lista) {
  const totalSpan = document.getElementById("comp-total");
  const pendSpan = document.getElementById("comp-pendientes");
  const gestSpan = document.getElementById("comp-gestion");
  const cumpSpan = document.getElementById("comp-cumplidos");

  const total = lista.length;
  const pendientes = lista.filter((c) => c.estado === "pendiente").length;
  const gestion = lista.filter((c) => c.estado === "gestion").length;
  const cumplidos = lista.filter((c) => c.estado === "cumplido").length;

  if (totalSpan) totalSpan.textContent = total;
  if (pendSpan) pendSpan.textContent = pendientes;
  if (gestSpan) gestSpan.textContent = gestion;
  if (cumpSpan) cumpSpan.textContent = cumplidos;
}

// ====== RENDER COMPROMISOS ====== //
function renderCompromisos(tbody) {
  if (!tbody) return;

  tbody.innerHTML = "";

  const listaComuna = compromisos.filter((c) => c.comuna === comunaCompActual);

  actualizarResumenCompromisos(listaComuna);

  if (listaComuna.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "Aún no hay compromisos registrados para esta comuna.";
    td.className = "small-text";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  listaComuna.forEach((compromiso) => {
    const tr = document.createElement("tr");

    const tdDesc = document.createElement("td");
    tdDesc.textContent = compromiso.descripcion;

    const tdTipo = document.createElement("td");
    tdTipo.textContent = compromiso.tipo;

    const tdEstado = document.createElement("td");
    const spanEstado = document.createElement("span");
    spanEstado.classList.add("estado-badge");
    let texto = "";
    if (compromiso.estado === "cumplido") {
      spanEstado.style.backgroundColor = "#e6f6ec";
      spanEstado.style.color = "#12653b";
      texto = "Cumplido";
    } else if (compromiso.estado === "gestion") {
      spanEstado.style.backgroundColor = "#e0f2fe";
      spanEstado.style.color = "#075985";
      texto = "En gestión";
    } else {
      spanEstado.style.backgroundColor = "#fff7e0";
      spanEstado.style.color = "#8a5a00";
      texto = "Pendiente";
    }
    spanEstado.textContent = texto;
    tdEstado.appendChild(spanEstado);

    const tdAcciones = document.createElement("td");
    const cont = document.createElement("div");
    cont.style.display = "flex";
    cont.style.flexDirection = "column";
    cont.style.gap = "4px";

    const btnPendiente = document.createElement("button");
    btnPendiente.textContent = "Pendiente";
    btnPendiente.className = "btn-secondary";
    btnPendiente.style.fontSize = "11px";
    btnPendiente.style.padding = "3px 8px";
    btnPendiente.addEventListener("click", () =>
      cambiarEstadoCompromiso(compromiso.id, "pendiente", tbody)
    );

    const btnGestion = document.createElement("button");
    btnGestion.textContent = "En gestión";
    btnGestion.className = "btn-secondary";
    btnGestion.style.fontSize = "11px";
    btnGestion.style.padding = "3px 8px";
    btnGestion.addEventListener("click", () =>
      cambiarEstadoCompromiso(compromiso.id, "gestion", tbody)
    );

    const btnCumplido = document.createElement("button");
    btnCumplido.textContent = "Cumplido";
    btnCumplido.className = "btn-secondary";
    btnCumplido.style.fontSize = "11px";
    btnCumplido.style.padding = "3px 8px";
    btnCumplido.addEventListener("click", () =>
      cambiarEstadoCompromiso(compromiso.id, "cumplido", tbody)
    );

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.className = "btn-secondary";
    btnEliminar.style.fontSize = "11px";
    btnEliminar.style.padding = "3px 8px";
    btnEliminar.addEventListener("click", () =>
      eliminarCompromiso(compromiso.id, tbody)
    );

    cont.appendChild(btnPendiente);
    cont.appendChild(btnGestion);
    cont.appendChild(btnCumplido);
    cont.appendChild(btnEliminar);
    tdAcciones.appendChild(cont);

    tr.appendChild(tdDesc);
    tr.appendChild(tdTipo);
    tr.appendChild(tdEstado);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
  });
}

// ====== ACCIONES ====== //
function cambiarEstadoCompromiso(id, nuevoEstado, tbody) {
  const comp = compromisos.find((c) => c.id === id);
  if (!comp) return;
  comp.estado = nuevoEstado;
  guardarCompromisos();
  renderCompromisos(tbody);
}

function eliminarCompromiso(id, tbody) {
  if (!confirm("¿Seguro que deseas eliminar este compromiso?")) return;
  compromisos = compromisos.filter((c) => c.id !== id);
  guardarCompromisos();
  renderCompromisos(tbody);
}
