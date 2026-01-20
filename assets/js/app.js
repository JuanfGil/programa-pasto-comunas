// Usuarios simulados para pruebas iniciales.
// Luego esto se reemplazará por datos reales desde la base de datos.
const usuarios = [
  { username: "dinamizador1", password: "1234", comuna: "Comuna 1" },
  { username: "dinamizador2", password: "1234", comuna: "Comuna 2" },
  { username: "dinamizador3", password: "1234", comuna: "Comuna 3" },
  // Agrega más si quieres hacer pruebas.
];

let comunaActual = null;

// Referencias DOM generales
const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const comunaSection = document.getElementById("comuna-section");
const loginError = document.getElementById("login-error");

const comunaTitle = document.getElementById("comuna-title");
const dinamizadorInfo = document.getElementById("dinamizador-info");
const logoutBtn = document.getElementById("logout-btn");

// Referencias del formulario de registro
const registroForm = document.getElementById("registro-form");
const tipoRegistroInput = document.getElementById("tipo-registro");
const nombreInput = document.getElementById("nombre");
const telefonoInput = document.getElementById("telefono");
const direccionInput = document.getElementById("direccion");
const zonaInput = document.getElementById("zona");
const tipoLiderInput = document.getElementById("tipo-lider");
const liderAsociadoInput = document.getElementById("lider-asociado");
const conoceLiderInput = document.getElementById("conoce-lider");
const votaTeresaInput = document.getElementById("vota-teresa");

// Tabla y resumen
const tbodyRegistros = document.getElementById("tbody-registros");
const totalRegistrosSpan = document.getElementById("total-registros");
const totalLideresSpan = document.getElementById("total-lideres");
const totalVotanSpan = document.getElementById("total-votan");

// Arreglo para guardar registros en memoria (simulado)
const registros = [];

// ------------------ LOGIN ------------------ //
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

  // Mostrar vista de comuna
  comunaTitle.textContent = comunaActual;
  dinamizadorInfo.textContent = `Sesión iniciada como: ${user.username}`;
  loginSection.style.display = "none";
  comunaSection.style.display = "block";

  // Cuando entra, refrescamos la tabla de esa comuna
  renderTablaYResumen();
});

// Cerrar sesión
logoutBtn.addEventListener("click", function () {
  comunaSection.style.display = "none";
  loginSection.style.display = "block";
  loginForm.reset();
  comunaActual = null;
});

// ------------------ REGISTRO DE DATOS ------------------ //
registroForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!comunaActual) {
    alert("No hay comuna activa.");
    return;
  }

  const nuevoRegistro = {
    comuna: comunaActual,
    tipoRegistro: tipoRegistroInput.value,
    nombre: nombreInput.value.trim(),
    telefono: telefonoInput.value.trim() || "",
    direccion: direccionInput.value.trim() || "",
    zona: zonaInput.value.trim() || "",
    tipoLider: tipoLiderInput.value || "",
    liderAsociado: liderAsociadoInput.value.trim() || "",
    conoceLider: conoceLiderInput.checked,
    votaTeresa: votaTeresaInput.checked,
    fechaCreacion: new Date().toISOString(),
  };

  registros.push(nuevoRegistro);

  // Limpiar formulario (conservamos tipo de registro si quieres)
  nombreInput.value = "";
  telefonoInput.value = "";
  direccionInput.value = "";
  zonaInput.value = "";
  tipoLiderInput.value = "";
  liderAsociadoInput.value = "";
  conoceLiderInput.checked = false;
  votaTeresaInput.checked = false;

  renderTablaYResumen();
});

// ------------------ RENDERIZAR TABLA Y RESUMEN ------------------ //
function renderTablaYResumen() {
  if (!comunaActual) return;

  // Filtrar solo registros de esta comuna
  const registrosComuna = registros.filter(
    (r) => r.comuna === comunaActual
  );

  // Limpiar cuerpo de tabla
  tbodyRegistros.innerHTML = "";

  registrosComuna.forEach((reg) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${reg.tipoRegistro}</td>
      <td>${reg.nombre}</td>
      <td>${reg.telefono}</td>
      <td>${reg.direccion}</td>
      <td>${reg.zona}</td>
      <td>${reg.tipoLider}</td>
      <td>${reg.liderAsociado}</td>
      <td>${reg.conoceLider ? "✅" : "✖"}</td>
      <td>${reg.votaTeresa ? "✅" : "✖"}</td>
    `;

    tbodyRegistros.appendChild(tr);
  });

  // Actualizar resumen
  const total = registrosComuna.length;
  const totalLideres = registrosComuna.filter(
    (r) => r.tipoRegistro === "Líder"
  ).length;
  const totalVotan = registrosComuna.filter(
    (r) => r.votaTeresa
  ).length;

  totalRegistrosSpan.textContent = total;
  totalLideresSpan.textContent = totalLideres;
  totalVotanSpan.textContent = totalVotan;
}
