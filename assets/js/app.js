// Usuarios simulados para pruebas iniciales.
// Luego esto lo reemplazamos por datos reales desde la base de datos.
const usuarios = [
  { username: "dinamizador1", password: "1234", comuna: "Comuna 1" },
  { username: "dinamizador2", password: "1234", comuna: "Comuna 2" },
  { username: "dinamizador3", password: "1234", comuna: "Comuna 3" },
  // Agrega más si quieres hacer pruebas.
];

const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const comunaSection = document.getElementById("comuna-section");
const loginError = document.getElementById("login-error");

const comunaTitle = document.getElementById("comuna-title");
const dinamizadorInfo = document.getElementById("dinamizador-info");
const logoutBtn = document.getElementById("logout-btn");

// Manejar login
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

  // Mostrar vista de comuna
  comunaTitle.textContent = user.comuna;
  dinamizadorInfo.textContent = `Sesión iniciada como: ${user.username}`;
  loginSection.style.display = "none";
  comunaSection.style.display = "block";

  // Aquí luego cargaremos:
  // - Base de datos de esa comuna
  // - Líderes
  // - Gráficos
});

// Cerrar sesión
logoutBtn.addEventListener("click", function () {
  comunaSection.style.display = "none";
  loginSection.style.display = "block";
  loginForm.reset();
});
