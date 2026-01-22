// ================================
// AUTH.JS - Usuarios / Roles
// ================================

(function () {
  // Roles:
  // - admin: Teresa (todo)
  // - gerencia: Camilo (todo)
  // - coordinador: Mario (todo)
  // - supervisor: Darwin (todas las comunas + panel general)
  // - dinamizador: 12 comunas, cada uno solo su comuna

  const AUTH_USERS = [
    // ✅ Teresa (Admin)
    { username: "teresa", password: "teresa123", rol: "admin", comuna: "ALL" },

    // ✅ Camilo (Gerencia)
    { username: "camilo", password: "camilo123", rol: "gerencia", comuna: "ALL" },

    // ✅ Mario (Coordinador)
    { username: "mario", password: "mario123", rol: "coordinador", comuna: "ALL" },

    // ✅ Darwin (todas las comunas)
    { username: "darwin", password: "darwin123", rol: "supervisor", comuna: "ALL" },

    // ✅ 12 Dinamizadores (uno por comuna)
    { username: "din1",  password: "comuna1",  rol: "dinamizador", comuna: "Comuna 1" },
    { username: "din2",  password: "comuna2",  rol: "dinamizador", comuna: "Comuna 2" },
    { username: "din3",  password: "comuna3",  rol: "dinamizador", comuna: "Comuna 3" },
    { username: "din4",  password: "comuna4",  rol: "dinamizador", comuna: "Comuna 4" },
    { username: "din5",  password: "comuna5",  rol: "dinamizador", comuna: "Comuna 5" },
    { username: "din6",  password: "comuna6",  rol: "dinamizador", comuna: "Comuna 6" },
    { username: "din7",  password: "comuna7",  rol: "dinamizador", comuna: "Comuna 7" },
    { username: "din8",  password: "comuna8",  rol: "dinamizador", comuna: "Comuna 8" },
    { username: "din9",  password: "comuna9",  rol: "dinamizador", comuna: "Comuna 9" },
    { username: "din10", password: "comuna10", rol: "dinamizador", comuna: "Comuna 10" },
    { username: "din11", password: "comuna11", rol: "dinamizador", comuna: "Comuna 11" },
    { username: "din12", password: "comuna12", rol: "dinamizador", comuna: "Comuna 12" },
  ];

  const LS_SESION = "pasto_sesion";

  function authGuardarSesion({ username, rol, comuna }) {
    const sesion = {
      username,
      rol,
      comuna, // "Comuna X" o "ALL"
      ts: Date.now()
    };
    localStorage.setItem(LS_SESION, JSON.stringify(sesion));
  }

  function authGetSesion() {
    try {
      return JSON.parse(localStorage.getItem(LS_SESION) || "null");
    } catch {
      return null;
    }
  }

  function authLogout() {
    localStorage.removeItem(LS_SESION);
    window.location.href = "index.html";
  }

  function authLogin(username, password) {
    const u = AUTH_USERS.find(
      (x) => x.username === username && x.password === password
    );
    if (!u) return null;

    authGuardarSesion({ username: u.username, rol: u.rol, comuna: u.comuna });
    return u;
  }

  function authIsFullAccess(rol) {
    const r = (rol || "").toLowerCase();
    return r === "admin" || r === "gerencia" || r === "coordinador" || r === "supervisor";
  }

  // Exponer al window
  window.PASTO_AUTH = {
    AUTH_USERS,
    authLogin,
    authGetSesion,
    authLogout,
    authGuardarSesion,
    authIsFullAccess,
  };
})();
