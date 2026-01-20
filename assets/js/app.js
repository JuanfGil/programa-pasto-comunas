// ================== USUARIOS SIMULADOS ================== //
const usuarios = [
  { username: "dinamizador1", password: "1234", comuna: "Comuna 1" },
  { username: "dinamizador2", password: "1234", comuna: "Comuna 2" },
  { username: "dinamizador3", password: "1234", comuna: "Comuna 3" },
];

// ================== ESTADO GLOBAL ================== //
let comunaActual = null;
let nextLiderId = 1;
let nextPersonaId = 1;
let lideres = [];
let personas = [];

// Claves para localStorage (compartidas con reportes.js)
const LS_LIDERES_KEY = "pasto_lideres";
const LS_PERSONAS_KEY = "pasto_personas";
const LS_SESION_KEY = "pasto_sesion";

// ================== PERSISTENCIA: DATOS ================== //
function cargarDatosDesdeLocalStorage() {
  try {
    const l = JSON.parse(localStorage.getItem(LS_LIDERES_KEY) || "[]");
    const p = JSON.parse(localStorage.getItem(LS_PERSONAS_KEY) || "[]");
    if (Array.isArray(l)) lideres = l;
    if (Array.isArray(p)) personas = p;

    if (lideres.length > 0) {
      nextLiderId = Math.max(...lideres.map((x) => x.id || 0)) + 1;
    }
    if (personas.length > 0) {
      nextPersonaId = Math.max(...personas.map((x) => x.id || 0)) + 1;
    }
  } catch (e) {
    console.warn("Error cargando datos:", e);
    lideres = [];
    personas = [];
  }
}

function guardarDatosEnLocalStorage() {
  try {
    localStorage.setItem(LS_LIDERES_KEY, JSON.stringify(lideres));
    localStorage.setItem(LS_PERSONAS_KEY, JSON.stringify(personas));
  } catch (e) {
    console.warn("Error guardando datos:", e);
  }
}

// ================== PERSISTENCIA: SESIÓN ================== //
function guardarSesion(user) {
  try {
    localStorage.setItem(
      LS_SESION_KEY,
      JSON.stringify({ username: user.username, comuna: user.comuna })
    );
  } catch (e) {
    console.warn("Error guardando sesión:", e);
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
    console.warn("Error cargando sesión:", e);
    return null;
  }
}

function limpiarSesion() {
  try {
    localStorage.removeItem(LS_SESION_KEY);
  } catch (e) {
    console.warn("Error limpiando sesión:", e);
  }
}

// ================== LÓGICA SOLO PARA index.html ================== //
document.addEventListener("DOMContentLoaded", () => {
  // Tomamos referencias; si no existen, significa que NO estamos en index.html
  const loginForm = document.getElementById("login-form");
  const loginSection = document.getElementById("login-section");
  const comunaSection = document.getElementById("comuna-section");

  // Si alguno de estos no existe, salimos y no hacemos nada más.
  if (!loginForm || !loginSection || !comunaSection) {
    return;
  }

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

  // -------- INICIALIZAR -------- //
  function inicializarApp() {
    cargarDatosDesdeLocalStorage();

    const sesion = cargarSesion();
    if (sesion) {
      const user = usuarios.find(
        (u) => u.username === sesion.username && u.comuna === sesion.comuna
      );
      if (user) {
        comunaActual = user.comuna;
        comunaTitle.textContent = comunaActual;
        dinamizadorInfo.textContent = `Sesión iniciada como: ${user.username}`;
        loginSection.style.display = "none";
        comunaSection.style.display = "block";
        renderVistaComuna();
        return;
      } else {
        limpiarSesion();
      }
    }
    // si no hay sesión → dejar login visible
    loginSection.style.display = "block";
    comunaSection.style.display = "none";
  }

  inicializarApp();

  // -------- LOGIN -------- //
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const user = usuarios.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      if (loginError) loginError.style.display = "block";
      return;
    }

    if (loginError) loginError.style.display = "none";
    comunaActual = user.comuna;

    comunaTitle.textContent = comunaActual;
    dinamizadorInfo.textContent = `Sesión iniciada como: ${user.username}`;
    loginSection.style.display = "none";
    comunaSection.style.display = "block";

    guardarSesion(user);
    renderVistaComuna();
  });

  // -------- LOGOUT -------- //
  logoutBtn.addEventListener("click", () => {
    comunaSection.style.display = "none";
    loginSection.style.display = "block";
    loginForm.reset();
    comunaActual = null;
    limpiarSesion();
  });

  // -------- REGISTRO LÍDER -------- //
  liderForm.addEventListener("submit", (event) => {
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
      nombre,
      documento,
      telefono: (liderTelefonoInput.value || "").trim(),
      direccion: (liderDireccionInput.value || "").trim(),
      zona: (liderZonaInput.value || "").trim(),
      tipo: liderTipoInput.value || "",
      fechaCreacion: new Date().toISOString(),
    };

    lideres.push(nuevoLider);
    guardarDatosEnLocalStorage();

    liderNombreInput.value = "";
    liderDocumentoInput.value = "";
    liderTelefonoInput.value = "";
    liderDireccionInput.value = "";
    liderZonaInput.value = "";
    liderTipoInput.value = "";

    renderVistaComuna();
  });

  // -------- REGISTRO PERSONA -------- //
  personaForm.addEventListener("submit", (event) => {
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
      liderId,
      nombre,
      documento,
      telefono: (personaTelefonoInput.value || "").trim(),
      direccion: (personaDireccionInput.value || "").trim(),
      zona: (personaZonaInput.value || "").trim(),
      conoceLider: !!personaConoceLiderInput.checked,
      votaTeresa: !!personaVotaTeresaInput.checked,
      fechaCreacion: new Date().toISOString(),
    };

    personas.push(nuevaPersona);
    guardarDatosEnLocalStorage();

    personaNombreInput.value = "";
    personaDocumentoInput.value = "";
    personaTelefonoInput.value = "";
    personaDireccionInput.value = "";
    personaZonaInput.value = "";
    personaConoceLiderInput.checked = true;
    personaVotaTeresaInput.checked = false;

    renderVistaComuna();
  });

  // -------- RENDER VISTA -------- //
  function renderVistaComuna() {
    if (!comunaActual) return;

    const lideresComuna = lideres.filter((l) => l.comuna === comunaActual);
    const personasComuna = personas.filter((p) => p.comuna === comunaActual);

    actualizarSelectLideres(lideresComuna);

    totalLideresSpan.textContent = lideresComuna.length;
    totalPersonasSpan.textContent = personasComuna.length;
    totalVotanSpan.textContent = personasComuna.filter((p) => p.votaTeresa).length;

    renderListaLideres(lideresComuna, personasComuna);
  }

  function actualizarSelectLideres(lideresComuna) {
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

      const header = document.createElement("div");
      header.className = "lider-header";

      const infoLeft = document.createElement("div");
      const nombreSpan = document.createElement("div");
      nombreSpan.className = "lider-nombre";
      nombreSpan.textContent = lider.nombre;

      const metaSpan = document.createElement("div");
      metaSpan.className = "lider-meta";
      metaSpan.textContent = [
        lider.documento ? `Doc: ${lider.documento}` : null,
        lider.telefono ? `Tel: ${lider.telefono}` : null,
        lider.direccion || null,
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

      const resumenTexto = document.createElement("div");
      resumenTexto.className = "lider-resumen";
      resumenTexto.textContent = totalPersonasLider
        ? "Personas vinculadas a este líder:"
        : "Aún no hay personas vinculadas a este líder.";
      card.appendChild(resumenTexto);

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
});
