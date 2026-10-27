/**
 * AUTENTICACIÓN, SESIÓN Y ROLES
 */

// 1. Verificar sesión al cargar app.html
function checkAppSession() {
  const sessionUser = JSON.parse(sessionStorage.getItem('sw_session_user')) || 
                      JSON.parse(localStorage.getItem('sw_session_user'));

  if (!sessionUser) {
    window.location.assign('index.html');
    return;
  }

  const nameEl = document.getElementById('userName');
  const emailEl = document.getElementById('userEmail');
  const avatarEl = document.getElementById('userAvatar');

  if (nameEl) nameEl.innerText = sessionUser.name || "Usuario";
  if (emailEl) emailEl.innerText = sessionUser.email || "Sin correo";
  if (avatarEl && sessionUser.picture) avatarEl.src = sessionUser.picture;
}

// 2. Callback de Google (llamado desde index.html)
function handleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  const userData = {
    name: payload.name,
    email: payload.email,
    picture: payload.picture
  };
  saveUserSession(userData);
}

// 3. Guardar sesión consultando el rol
async function saveUserSession(userData) {
  const rememberEl = document.getElementById('rememberMe');
  const remember = rememberEl ? rememberEl.checked : false;

  let role = "USER";
  if (typeof apiService !== 'undefined') {
    try {
      role = await apiService.getUserRole(userData.email);
      userData.role = role;
      apiService.syncUser(userData); 
    } catch (e) {
      console.warn("No se pudo consultar el rol.");
      userData.role = "USER";
    }
  }

  if (remember) {
    localStorage.setItem('sw_session_user', JSON.stringify(userData));
  } else {
    sessionStorage.setItem('sw_session_user', JSON.stringify(userData));
  }

  window.location.assign('app.html');
}

// 4. Cerrar Sesión (Global)
window.logout = function() {
  sessionStorage.removeItem('sw_session_user');
  localStorage.removeItem('sw_session_user');
  window.location.assign('index.html');
};

// 5. Aplicar visibilidad de Admin/User (Global)
window.applyUserRole = function() {
  const sessionUser = JSON.parse(sessionStorage.getItem('sw_session_user')) || 
                      JSON.parse(localStorage.getItem('sw_session_user'));
                      
  const btnAdmin = document.getElementById('btnAdmin');
  
  if (sessionUser && sessionUser.role === "ADMIN") {
    if (btnAdmin) btnAdmin.classList.remove('hidden');
  } else {
    if (btnAdmin) btnAdmin.classList.add('hidden');
    if (typeof app !== 'undefined' && app.setRole) {
      app.setRole('user');
    }
  }
};

// 6. Decodificador de Token JWT
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error parseando token", e);
    return {};
  }
}

// 7. Lógica del Botón Demo
document.addEventListener('DOMContentLoaded', () => {
  const btnDemo = document.getElementById('btnDemoLogin');
  if (btnDemo) {
    btnDemo.addEventListener('click', async function(e) {
      e.preventDefault();
      const demoUser = {
        name: "Operario Demo",
        email: "operario@almacen.com",
        picture: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
      };
      await saveUserSession(demoUser);
    });
  }
});