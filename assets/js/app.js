// ================================
// CONFIGURACIÓN GENERAL
// ================================
const LS_SESION_KEY = "pasto_sesion";
const LS_DATOS_KEY = "pasto_datos";

// Estructura en memoria
let datos = {};             // { "Comuna X": { lideres: [ {id, ..., personas: [...] } ] } }
let comunaActual = null;
let usuarioActual = null;
let nextLiderId = 1;
let nextPersonaId = 1;

// Usuarios de ejemplo (ajusta si quieres otros)
const USUARIOS = [
  { username: "dinamizador1", password: "1234", comuna: "Comuna 1" },
  { username: "dinamizador2", password: "1234", comuna: "Comuna 2" },
  { username: "dinamizador3", password: "1234", comuna: "Comuna 3" },
];

// ================================
// SESIÓN
// ================================
function cargarSesion() {
  try {
    const raw = localStorage.getItem(LS_SESION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion || !sesion.username || !sesion.comuna) return null;
    return sesion;
  } catch (e) {
    console.warn("Error al cargar sesión:", e);
    return null;
  }
}

function guardarSesion(username, comuna) {
  const sesion = { username, comuna };
  localStorage.setItem(LS_SESION_KEY, JSON.stringify(sesion));
}

function cerrarSesion() {
  localStorage.removeItem(LS_SESION_KEY);
  window.location.href = "index.html";
}

// ================================
// DATOS (LÍDERES Y PERSONAS)
// ================================
function cargarDatos() {
  try {
    const raw = localStorage.getItem(LS_DATOS_KEY);
    if (!raw) {
      datos = {};
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      datos = {};
      return;
    }
    datos = parsed;
  } catch (e) {
    console.warn("Error al cargar datos:", e);
    datos = {};
  }

  // Calcular siguientes IDs en función de lo que ya exista
  let maxLider = 0;
  let maxPersona = 0;

  Object.values(datos).forEach((comunaData) => {
    if (!comunaData || !Array.isArray(comunaData.lideres)) return;
    comunaData.lideres.forEach((lider) => {
      if (lider.id && lider.id > maxLider) maxLider = lider.id;
      if (Array.isArray(lider.personas)) {
        lider.personas.forEach((p) => {
          if (p.id && p.id > maxPersona) maxPersona = p.id;
        });
      }
    });
  });

  nextLiderId = maxLider + 1;
  nextPersonaId = maxPersona + 1;
}

function guardarDatos() {
  try {
    localStorage.setItem(LS_DATOS_KEY, JSON.stringify(datos));
  } catch (e) {
    console.warn("Error al guardar datos:", e);
  }
}

function obtenerDatosComunaActual() {
  if (!comunaActual) return null;
  if (!datos[comunaActual]) {
    datos[comunaActual] = { lideres: [] };
  }
  if (!Array.isArray(datos[comunaActual].lideres)) {
    datos[comunaActual].lideres = [];
  }
  return datos[comunaActual];
}

// ================================
// RENDER: RESUMEN Y LISTA
// ================================
function refrescarUICaptura() {
  const comunaData = obtenerDatosComunaActual();
  if (!comunaData) return;

  const lideres = comunaData.lideres || [];

  // Totales
  const totalLideresSpan = document.getElementById("total-lideres");
  const totalPersonasSpan = document.getElementById("total-personas");
  const totalVotanSpan = document.getElementById("total-votan");

  let totalPersonas = 0;
  let totalVotan = 0;

  lideres.forEach((lider) => {
    if (!Array.isArray(lider.personas)) return;
    totalPersonas += lider.personas.length;
    lider.personas.forEach((p) => {
      if (p.votaTeresa) totalVotan += 1;
    });
  });

  if (totalLideresSpan) totalLideresSpan.textContent = lideres.length.toString();
  if (totalPersonasSpan) totalPersonasSpan.textContent = totalPersonas.toString();
  if (totalVotanSpan) totalVotanSpan.textContent = totalVotan.toString();

  // Select de líderes (para personas)
  const selectLiderPersona = document.getElementById("select-lider-persona");
  if (selectLiderPersona) {
    const valorPrevio = selectLiderPersona.value;
    selectLiderPersona.innerHTML = "";
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "Seleccione un líder";
    selectLiderPersona.appendChild(optDefault);

    lideres.forEach((lider) => {
      const opt = document.createElement("option");
      opt.value = String(lider.id);
      opt.textContent = lider.nombre || `Líder #${lider.id}`;
      selectLiderPersona.appendChild(opt);
    });

    // intentar recuperar selección anterior
    if (valorPrevio) {
      selectLiderPersona.value = valorPrevio;
    }
  }

  // Lista de líderes
  const contListaLideres = document.getElementById("lista-lideres");
  if (!contListaLideres) return;
  contListaLideres.innerHTML = "";

  if (lideres.length === 0) {
    const p = document.createElement("p");
    p.className = "small-text";
    p.textContent = "Aún no hay líderes registrados para esta comuna.";
    contListaLideres.appendChild(p);
    return;
  }

  lideres.forEach((lider) => {
    const card = document.createElement("div");
    card.className = "lider-card";

    // Encabezado del líder
    const header = document.createElement("div");
    header.className = "lider-header";

    const infoLider = document.createElement("div");
    const nombreEl = document.createElement("div");
    nombreEl.className = "lider-nombre";
    nombreEl.textContent = lider.nombre || "(Sin nombre)";

    const metaEl = document.createElement("div");
    metaEl.className = "lider-meta";
    const docText = lider.documento ? `Doc: ${lider.documento}` : "Doc: N/D";
    const tipoText = lider.tipo ? `Tipo: ${lider.tipo}` : "Tipo: N/D";
    metaEl.textContent = `${docText} · ${tipoText}`;

    infoLider.appendChild(nombreEl);
    infoLider.appendChild(metaEl);

    const bloqueBtnsLider = document.createElement("div");
    bloqueBtnsLider.style.display = "flex";
    bloqueBtnsLider.style.flexDirection = "column";
    bloqueBtnsLider.style.gap = "4px";

    const btnEditarLider = document.createElement("button");
    btnEditarLider.className = "btn-secondary";
    btnEditarLider.style.fontSize = "11px";
    btnEditarLider.style.padding = "3px 8px";
    btnEditarLider.textContent = "Editar líder";
    btnEditarLider.addEventListener("click", () => editarLider(lider.id));

    const btnEliminarLider = document.createElement("button");
    btnEliminarLider.className = "btn-secondary";
    btnEliminarLider.style.fontSize = "11px";
    btnEliminarLider.style.padding = "3px 8px";
    btnEliminarLider.textContent = "Eliminar líder";
    btnEliminarLider.addEventListener("click", () => eliminarLider(lider.id));

    bloqueBtnsLider.appendChild(btnEditarLider);
    bloqueBtnsLider.appendChild(btnEliminarLider);

    header.appendChild(infoLider);
    header.appendChild(bloqueBtnsLider);

    card.appendChild(header);

    // Resumen del líder
    const resumen = document.createElement("div");
    resumen.className = "lider-resumen";

    const numPersonas = Array.isArray(lider.personas) ? lider.personas.length : 0;
    let numVotan = 0;
    if (Array.isArray(lider.personas)) {
      lider.personas.forEach((p) => {
        if (p.votaTeresa) numVotan += 1;
      });
    }

    resumen.textContent = `Personas vinculadas: ${numPersonas} · Votan por Teresa: ${numVotan}`;
    card.appendChild(resumen);

    // Tabla de personas
    const wrapperTabla = document.createElement("div");
    wrapperTabla.className = "lider-tabla-wrapper";

    const tabla = document.createElement("table");
    tabla.className = "lider-tabla";

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    [
      "Nombre",
      "Documento",
      "Teléfono",
      "Dirección",
      "Zona",
      "Conoce líder",
      "Vota Teresa",
      "Acciones",
    ].forEach((txt) => {
      const th = document.createElement("th");
      th.textContent = txt;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    if (Array.isArray(lider.personas) && lider.personas.length > 0) {
      lider.personas.forEach((persona) => {
        const tr = document.createElement("tr");

        const tdNombre = document.createElement("td");
        tdNombre.textContent = persona.nombre || "";

        const tdDoc = document.createElement("td");
        tdDoc.textContent = persona.documento || "";

        const tdTel = document.createElement("td");
        tdTel.textContent = persona.telefono || "";

        const tdDir = document.createElement("td");
        tdDir.textContent = persona.direccion || "";

        const tdZona = document.createElement("td");
        tdZona.textContent = persona.zona || "";

        const tdConoce = document.createElement("td");
        tdConoce.textContent = persona.conoceLider ? "Sí" : "No";

        const tdVota = document.createElement("td");
        tdVota.textContent = persona.votaTeresa ? "Sí" : "No";

        const tdAcciones = document.createElement("td");
        const contBtns = document.createElement("div");
        contBtns.style.display = "flex";
        contBtns.style.flexDirection = "column";
        contBtns.style.gap = "4px";

        const btnEditarPersona = document.createElement("button");
        btnEditarPersona.className = "btn-secondary";
        btnEditarPersona.style.fontSize = "11px";
        btnEditarPersona.style.padding = "3px 8px";
        btnEditarPersona.textContent = "Editar";
        btnEditarPersona.addEventListener("click", () =>
          editarPersona(lider.id, persona.id)
        );

        const btnEliminarPersona = document.createElement("button");
        btnEliminarPersona.className = "btn-secondary";
        btnEliminarPersona.style.fontSize = "11px";
        btnEliminarPersona.style.padding = "3px 8px";
        btnEliminarPersona.textContent = "Eliminar";
        btnEliminarPersona.addEventListener("click", () =>
          eliminarPersona(lider.id, persona.id)
        );

        contBtns.appendChild(btnEditarPersona);
        contBtns.appendChild(btnEliminarPersona);
        tdAcciones.appendChild(contBtns);

        tr.appendChild(tdNombre);
        tr.appendChild(tdDoc);
        tr.appendChild(tdTel);
        tr.appendChild(tdDir);
        tr.appendChild(tdZona);
        tr.appendChild(tdConoce);
        tr.appendChild(tdVota);
        tr.appendChild(tdAcciones);

        tbody.appendChild(tr);
      });
    } else {
      const trVacio = document.createElement("tr");
      const tdVacio = document.createElement("td");
      tdVacio.colSpan = 8;
      tdVacio.textContent = "Este líder aún no tiene personas vinculadas.";
      tdVacio.className = "small-text";
      trVacio.appendChild(tdVacio);
      tbody.appendChild(trVacio);
    }

    tabla.appendChild(tbody);
    wrapperTabla.appendChild(tabla);
    card.appendChild(wrapperTabla);

    contListaLideres.appendChild(card);
  });
}

// ================================
// CRUD LÍDER
// ================================
function agregarLiderDesdeFormulario() {
  const comunaData = obtenerDatosComunaActual();
  if (!comunaData) return;

  const nombreInput = document.getElementById("lider-nombre");
  const docInput = document.getElementById("lider-documento");
  const telInput = document.getElementById("lider-telefono");
  const dirInput = document.getElementById("lider-direccion");
  const zonaInput = document.getElementById("lider-zona");
  const tipoSelect = document.getElementById("lider-tipo");

  const nombre = (nombreInput.value || "").trim();
  const documento = (docInput.value || "").trim();
  const telefono = (telInput.value || "").trim();
  const direccion = (dirInput.value || "").trim();
  const zona = (zonaInput.value || "").trim();
  const tipo = (tipoSelect.value || "").trim();

  if (!nombre || !documento) {
    alert("Por favor diligencia al menos nombre y número de documento del líder.");
    return;
  }

  const nuevoLider = {
    id: nextLiderId++,
    nombre,
    documento,
    telefono,
    direccion,
    zona,
    tipo,
    personas: [],
  };

  comunaData.lideres.push(nuevoLider);
  guardarDatos();
  refrescarUICaptura();

  nombreInput.value = "";
  docInput.value = "";
  telInput.value = "";
  dirInput.value = "";
  zonaInput.value = "";
  tipoSelect.value = "";
}

function editarLider(idLider) {
  const comunaData = obtenerDatosComunaActual();
  if (!comunaData) return;

  const lider = comunaData.lideres.find((l) => l.id === idLider);
  if (!lider) return;

  const nuevoNombre = prompt("Nombre del líder:", lider.nombre || "");
  if (nuevoNombre === null) return;

  const nuevoDoc = prompt("Número de documento:", lider.documento || "");
  if (nuevoDoc === null) return;

  const nuevoTel = prompt("Teléfono:", lider.telefono || "");
  if (nuevoTel === null) return;

  const nuevaDir = prompt("Dirección / Barrio:", lider.direccion || "");
  if (nuevaDir === null) return;

  const nuevaZona = prompt("Zona de votación:", lider.zona || "");
  if (nuevaZona === null) return;

  const nuevoTipo = prompt(
    "Tipo de líder (A, B o C):",
    lider.tipo || ""
  );
  if (nuevoTipo === null) return;

  lider.nombre = nuevoNombre.trim();
  lider.documento = nuevoDoc.trim();
  lider.telefono = nuevoTel.trim();
  lider.direccion = nuevaDir.trim();
  lider.zona = nuevaZona.trim();
  lider.tipo = nuevoTipo.trim().toUpperCase();

  guardarDatos();
  refrescarUICaptura();
}

function eliminarLider(idLider) {
  const comunaData = obtenerDatosComunaActual();
  if (!comunaData) return;

  const lider = comunaData.lideres.find((l) => l.id === idLider);
  if (!lider) return;

  const confirmar = confirm(
    `¿Seguro que deseas eliminar al líder "${lider.nombre}" y TODAS sus personas vinculadas?`
  );
  if (!confirmar) return;

  comunaData.lideres = comunaData.lideres.filter((l) => l.id !== idLider);
  guardarDatos();
  refrescarUICaptura();
}

// ================================
// CRUD PERSONA
// ================================
function agregarPersonaDesdeFormulario() {
  const comunaData = obtenerDatosComunaActual();
  if (!comunaData) return;

  const selectLider = document.getElementById("select-lider-persona");
  const nombreInput = document.getElementById("persona-nombre");
  const docInput = document.getElementById("persona-documento");
  const telInput = document.getElementById("persona-telefono");
  const dirInput = document.getElementById("persona-direccion");
  const zonaInput = document.getElementById("persona-zona");
  const chkConoce = document.getElementById("persona-conoce-lider");
  const chkVota = document.getElementById("persona-vota-teresa");

  const idLider = parseInt(selectLider.value, 10);
  if (!idLider) {
    alert("Selecciona un líder para asociar la persona.");
    return;
  }

  const lider = comunaData.lideres.find((l) => l.id === idLider);
  if (!lider) {
    alert("No se encontró el líder seleccionado. Intenta de nuevo.");
    return;
  }

  const nombre = (nombreInput.value || "").trim();
  const documento = (docInput.value || "").trim();
  const telefono = (telInput.value || "").trim();
  const direccion = (dirInput.value || "").trim();
  const zona = (zonaInput.value || "").trim();
  const conoceLider = !!chkConoce.checked;
  const votaTeresa = !!chkVota.checked;

  if (!nombre || !documento) {
    alert("Por favor diligencia al menos nombre y número de documento de la persona.");
    return;
  }

  if (!Array.isArray(lider.personas)) {
    lider.personas = [];
  }

  const nuevaPersona = {
    id: nextPersonaId++,
    nombre,
    documento,
    telefono,
    direccion,
    zona,
    conoceLider,
    votaTeresa,
  };

  lider.personas.push(nuevaPersona);
  guardarDatos();
  refrescarUICaptura();

  nombreInput.value = "";
  docInput.value = "";
  telInput.value = "";
  dirInput.value = "";
  zonaInput.value = "";
  chkConoce.checked = true;
  chkVota.checked = false;
}

function editarPersona(idLider, idPersona) {
  const comunaData = obtenerDatosComunaActual();
  if (!comunaData) return;

  const lider = comunaData.lideres.find((l) => l.id === idLider);
  if (!lider || !Array.isArray(lider.personas)) return;

  const persona = lider.personas.find((p) => p.id === idPersona);
  if (!persona) return;

  const nuevoNombre = prompt("Nombre de la persona:", persona.nombre || "");
  if (nuevoNombre === null) return;

  const nuevoDoc = prompt("Número de documento:", persona.documento || "");
  if (nuevoDoc === null) return;

  const nuevoTel = prompt("Teléfono:", persona.telefono || "");
  if (nuevoTel === null) return;

  const nuevaDir = prompt("Dirección:", persona.direccion || "");
  if (nuevaDir === null) return;

  const nuevaZona = prompt("Zona de votación:", persona.zona || "");
  if (nuevaZona === null) return;

  const respConoce = prompt(
    '¿Conoce al líder? (s/n)',
    persona.conoceLider ? "s" : "n"
  );
  if (respConoce === null) return;

  const respVota = prompt(
    '¿Se compromete a votar por Teresa? (s/n)',
    persona.votaTeresa ? "s" : "n"
  );
  if (respVota === null) return;

  persona.nombre = nuevoNombre.trim();
  persona.documento = nuevoDoc.trim();
  persona.telefono = nuevoTel.trim();
  persona.direccion = nuevaDir.trim();
  persona.zona = nuevaZona.trim();
  persona.conoceLider = respConoce.toLowerCase().startsWith("s");
  persona.votaTeresa = respVota.toLowerCase().startsWith("s");

  guardarDatos();
  refrescarUICaptura();
}

function eliminarPersona(idLider, idPersona) {
  const comunaData = obtenerDatosComunaActual();
  if (!comunaData) return;

  const lider = comunaData.lideres.find((l) => l.id === idLider);
  if (!lider || !Array.isArray(lider.personas)) return;

  const persona = lider.personas.find((p) => p.id === idPersona);
  if (!persona) return;

  const confirmar = confirm(
    `¿Seguro que deseas eliminar a la persona "${persona.nombre}"?`
  );
  if (!confirmar) return;

  lider.personas = lider.personas.filter((p) => p.id !== idPersona);
  guardarDatos();
  refrescarUICaptura();
}

// ================================
// INICIO (DOMContentLoaded)
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const comunaSection = document.getElementById("comuna-section");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const comunaTitle = document.getElementById("comuna-title");
  const dinamizadorInfo = document.getElementById("dinamizador-info");
  const logoutBtn = document.getElementById("logout-btn");

  cargarDatos();

  const sesion = cargarSesion();
  if (sesion) {
    usuarioActual = sesion.username;
    comunaActual = sesion.comuna;

    if (loginSection) loginSection.style.display = "none";
    if (comunaSection) comunaSection.style.display = "block";

    if (comunaTitle) comunaTitle.textContent = comunaActual;
    if (dinamizadorInfo) {
      dinamizadorInfo.textContent = `Sesión activa como: ${usuarioActual}`;
    }

    refrescarUICaptura();
  } else {
    if (loginSection) loginSection.style.display = "block";
    if (comunaSection) comunaSection.style.display = "none";
  }

  // Manejo login
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const usernameInput = document.getElementById("username");
      const passwordInput = document.getElementById("password");

      const user = (usernameInput.value || "").trim();
      const pass = (passwordInput.value || "").trim();

      const encontrado = USUARIOS.find(
        (u) => u.username === user && u.password === pass
      );

      if (!encontrado) {
        if (loginError) loginError.style.display = "block";
        return;
      }

      usuarioActual = encontrado.username;
      comunaActual = encontrado.comuna;
      guardarSesion(usuarioActual, comunaActual);

      if (loginError) loginError.style.display = "none";
      if (loginSection) loginSection.style.display = "none";
      if (comunaSection) comunaSection.style.display = "block";

      if (comunaTitle) comunaTitle.textContent = comunaActual;
      if (dinamizadorInfo) {
        dinamizadorInfo.textContent = `Sesión activa como: ${usuarioActual}`;
      }

      refrescarUICaptura();
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      cerrarSesion();
    });
  }

  // Formularios de captura
  const liderForm = document.getElementById("lider-form");
  if (liderForm) {
    liderForm.addEventListener("submit", (event) => {
      event.preventDefault();
      agregarLiderDesdeFormulario();
    });
  }

  const personaForm = document.getElementById("persona-form");
  if (personaForm) {
    personaForm.addEventListener("submit", (event) => {
      event.preventDefault();
      agregarPersonaDesdeFormulario();
    });
  }
});
