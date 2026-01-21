// ================================
// AUTH / ROLES (NO TOCA app.js)
// ================================

const AUTH_USERS = [
  // Admin / Gerencia / Coordinador
  { username: "admin", password: "admin123", rol: "admin", comuna: null },
  { username: "gerencia", password: "gerencia123", rol: "gerencia", comuna: null },
  { username: "coordinador", password: "coord123", rol: "coordinador", comuna: null },

  // Dinamizadores (ajusta luego a los reales)
  { username: "dinamizador1", password: "1234", rol: "dinamizador", comuna: "Comuna 1" },
  { username: "dinamizador2", password: "1234", rol: "dinamizador", comuna: "Comuna 2" },
  { username: "dinamizador3", password: "1234", rol: "dinamizador", comuna: "Comuna 3" }
];

function authGuardarSesion(sesion) {
  localStorage.setItem("pasto_sesion", JSON.stringify(sesion));
}

function authObtenerSesion() {
  try {
    return JSON.parse(localStorage.getItem("pasto_sesion") || "null");
  } catch {
    return null;
  }
}

function authCerrarSesion() {
  localStorage.removeItem("pasto_sesion");
}

// Exponer a nivel global para NO tocar app.js
window.PASTO_AUTH = {
  AUTH_USERS,
  authGuardarSesion,
  authObtenerSesion,
  authCerrarSesion
};
