// Usuarios simulados para pruebas iniciales.
const usuarios = [
  { username: "dinamizador1", password: "1234", comuna: "Comuna 1" },
  { username: "dinamizador2", password: "1234", comuna: "Comuna 2" },
  { username: "dinamizador3", password: "1234", comuna: "Comuna 3" },
  // Agrega más si quieres hacer pruebas.
];

let comunaActual = null;

// Counters para IDs internos
let nextLiderId = 1;
let nextPersonaId = 1;

// Datos en memoria
const lideres = [];   // { id, comuna, nombre, documento, telefono, direccion, zona, tipo }
const personas = [];  // { id, comuna, liderId, nombre, documento, telefono, direccion, zona, conoceLider, votaTeresa }

// --------- Referencias DOM generales --------- //
const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const comunaSection = document.getElementById("comuna-section");
const loginError = document.getElementById("login-error");

const comunaTitle = document.getElementById("comuna-title");
const dinamizadorInfo = document.getElementById("dinamizador-info");
const logoutBtn = document.getElementById("logout-btn");

// Formularios
const liderForm = document.getElementById("lider-form");
const personaForm = document.getElementById("persona-form");

// Inputs de líder
const liderNombreInput = document.getElementById("lider-nombre");
const liderDocumentoInput = document.getElementById("lider-documento");
const liderTelefonoInput = document.getElementById("lider-telefono");
const liderDireccionInput = document.getElementById("lider-direccion");
const liderZonaInput = document.getElementById("lider-zona");
const liderTipoInput = document.getElementById("lider-tipo");

// Inputs de persona
const selectLiderPersona = document.getElementById("select-lider-persona");
const personaNombreInput = document.getElementById("persona-nombre");
const personaDocumentoInput = document.getElementById("persona-documento");
const personaTelefonoInput = document.getElementById("persona-telefono");
const personaDireccionInput = document.getElementById("persona-direccion");
const personaZonaInput = document.getElementById("persona-zona");
const personaConoceLiderInput = document.getElementById("persona-conoce-lider");
const personaVotaTeresaInput = document.getElementById("persona-vota-teresa");

// Resumen
const totalLideresSpan = document.getElementById("total-lideres");
const totalPersonasSpan = document.getElementById("total-personas");
const totalVotanSpan = document.getElementById("total-votan");

// Lista de líderes
const listaLideresDiv = document.getElementById("lista-lideres");

// --------- LOGIN --------- //
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const user = usuarios.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    loginError.style.display = "block";
    return;
  }

  loginError.style.display = "none";
  comunaActual = user.comuna;

  comunaTitle.textContent = comunaActual;
  dinamizadorInfo.textContent = `Sesión iniciada como: ${user.username}`;
  loginSection.style.display = "none";
  comunaSection.style.display = "block";

  renderVistaComuna();
});

logoutBtn.addEventListener("click", function () {
  comunaSection.style.display = "none";
  loginSection.style.display = "block";
  loginForm.reset();
  comunaActual = null;
});

// --------- REGISTRO DE LÍDER --------- //
liderForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!comunaActual) {
    alert("No hay comuna activa.");
    return;
  }

  const nombre = liderNombreInput.value.trim();
  const documento = liderDocumentoInput.value.trim();

  if (!nombre || !documento) return;

  const nuevoLider = {
    id: nextLiderId++,
    comuna: comunaActual,
    nombre: nombre,
    documento: documento,
    telefono: (liderTelefonoInput.value || "").trim(),
    direccion: (liderDireccionInput.value || "").trim(),
    zona: (liderZonaInput.value || "").trim(),
    tipo: liderTipoInput.value || "",
    fechaCreacion: new Date().toISOString(),
  };

  lideres.push(nuevoLider);

  // Limpiar formulario
  liderNombreInput.value = "";
  liderDocumentoInput.value = "";
  liderTelefonoInput.value = "";
  liderDireccionInput.value = "";
  liderZonaInput.value = "";
  liderTipoInput.value = "";

  renderVistaComuna();
});

// --------- REGISTRO DE PERSONA VINCULADA --------- //
personaForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!comunaActual) {
    alert("No hay comuna activa.");
    return;
  }

  const liderIdStr = selectLiderPersona.value;
  if (!liderIdStr) {
    alert("Seleccione un líder para vincular la persona.");
    return;
  }

  const nombre = personaNombreInput.value.trim();
  const documento = personaDocumentoInput.value.trim();
  if (!nombre || !documento) return;

  const liderId = parseInt(liderIdStr, 10);

  const nuevaPersona = {
    id: nextPersonaId++,
    comuna: comunaActual,
    liderId: liderId,
    nombre: nombre,
    documento: documento,
    telefono: (personaTelefonoInput.value || "").trim(),
    direccion: (personaDireccionInput.value || "").trim(),
    zona: (personaZonaInput.value || "").trim(),
    conoceLider: !!personaConoceLiderInput.checked,
    votaTeresa: !!personaVotaTeresaInput.checked,
    fechaCreacion: new Date().toISOString(),
  };

  personas.push(nuevaPersona);

  // Limpiar formulario (dejamos el líder seleccionado)
  personaNombreInput.value = "";
  personaDocumentoInput.value = "";
  personaTelefonoInput.value = "";
  personaDireccionInput.value = "";
  personaZonaInput.value = "";
  personaConoceLiderInput.checked = true;
  personaVotaTeresaInput.checked = false;

  renderVistaComuna();
});

// --------- RENDER PRINCIPAL DE LA COMUNA --------- //
function renderVistaComuna() {
  if (!comunaActual) return;

  const lideresComuna = lideres.filter((l) => l.comuna === comunaActual);
  const personasComuna = personas.filter((p) => p.comuna === comunaActual);

  // 1. Actualizar el select de líderes del formulario de personas
  actualizarSelectLideres(lideresComuna);

  // 2. Actualizar resumen
  const totalLideres = lideresComuna.length;
  const totalPersonas = personasComuna.length;
  const totalVotan = personasComuna.filter((p) => p.votaTeresa).length;

  totalLideresSpan.textContent = totalLideres;
  totalPersonasSpan.textContent = totalPersonas;
  totalVotanSpan.textContent = totalVotan;

  // 3. Dibujar lista de líderes con sus personas
  renderListaLideres(lideresComuna, personasComuna);
}

function actualizarSelectLideres(lideresComuna) {
  // limpiar
  selectLiderPersona.innerHTML = '<option value="">Seleccione un líder</option>';

  lideresComuna.forEach((lider) => {
    const opt = document.createElement("option");
    opt.value = String(lider.id);
    opt.textContent = lider.nombre;
    selectLiderPersona.appendChild(opt);
  });
}

function renderListaLideres(lideresComuna, personasComuna) {
  listaLideresDiv.innerHTML = "";

  if (lideresComuna.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Aún no hay líderes registrados en esta comuna.";
    p.className = "small-text";
    listaLideresDiv.appendChild(p);
    return;
  }

  lideresComuna.forEach((lider) => {
    const card = document.createElement("div");
    card.className = "lider-card";

    const personasDelLider = personasComuna.filter(
      (p) => p.liderId === lider.id
    );

    // Header
    const header = document.createElement("div");
    header.className = "lider-header";

    const infoLeft = document.createElement("div");
    const infoRight = document.createElement("div");

    const nombreSpan = document.createElement("div");
    nombreSpan.className = "lider-nombre";
    nombreSpan.textContent = lider.nombre;

    const metaSpan = document.createElement("div");
    metaSpan.className = "lider-meta";
    metaSpan.textContent = [
      lider.documento ? `Doc: ${lider.documento}` : null,
      lider.telefono ? `Tel: ${lider.telefono}` : null,
      lider.direccion ? lider.direccion : null,
      lider.zona ? `Zona: ${lider.zona}` : null,
      lider.tipo ? `Tipo: ${lider.tipo}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    infoLeft.appendChild(nombreSpan);
    if (metaSpan.textContent) infoLeft.appendChild(metaSpan);

    const resumenRight = document.createElement("div");
    resumenRight.className = "lider-meta";
    const totalPersonasLider = personasDelLider.length;
    const totalVotanLider = personasDelLider.filter((p) => p.votaTeresa).length;

    resumenRight.textContent = `Personas: ${totalPersonasLider} | Votan Teresa: ${totalVotanLider}`;

    header.appendChild(infoLeft);
    header.appendChild(resumenRight);

    card.appendChild(header);

    // Texto resumen debajo
    const resumenTexto = document.createElement("div");
    resumenTexto.className = "lider-resumen";
    resumenTexto.textContent = totalPersonasLider
      ? "Personas vinculadas a este líder:"
      : "Aún no hay personas vinculadas a este líder.";
    card.appendChild(resumenTexto);

    // Tabla de personas
    if (totalPersonasLider > 0) {
      const tablaWrapper = document.createElement("div");
      tablaWrapper.className = "lider-tabla-wrapper";

      const table = document.createElement("table");
      table.className = "lider-tabla";

      table.innerHTML = `
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Zona</th>
            <th>Conoce líder</th>
            <th>Vota Teresa</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector("tbody");

      personasDelLider.forEach((per) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${per.nombre}</td>
          <td>${per.documento}</td>
          <td>${per.telefono}</td>
          <td>${per.direccion}</td>
          <td>${per.zona}</td>
          <td>${per.conoceLider ? "✅" : "✖"}</td>
          <td>${per.votaTeresa ? "✅" : "✖"}</td>
        `;
        tbody.appendChild(tr);
      });

      tablaWrapper.appendChild(table);
      card.appendChild(tablaWrapper);
    }

    listaLideresDiv.appendChild(card);
  });
}
