function checkAppSession() {
  const sessionUser = JSON.parse(sessionStorage.getItem('sw_session_user')) || 
                      JSON.parse(localStorage.getItem('sw_session_user'));

  if (!sessionUser) {
    window.location.assign('index.html');
  } else {
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl) nameEl.innerText = sessionUser.name;
    if (emailEl) emailEl.innerText = sessionUser.email;
    if (avatarEl && sessionUser.picture) avatarEl.src = sessionUser.picture;
  }
}

function handleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  const userData = {
    name: payload.name,
    email: payload.email,
    picture: payload.picture
  };
  saveUserSession(userData);
}

async function saveUserSession(userData) {
  const rememberEl = document.getElementById('rememberMe');
  const remember = rememberEl ? rememberEl.checked : false;

  // 1. Consultar Rol a la nube
  let role = "USER";
  if (typeof apiService !== 'undefined') {
    role = await apiService.getUserRole(userData.email);
    userData.role = role;
    apiService.syncUser(userData);
  }

  // 2. Guardar en navegador
  if (remember) localStorage.setItem('sw_session_user', JSON.stringify(userData));
  else sessionStorage.setItem('sw_session_user', JSON.stringify(userData));

  // 3. Redirigir
  window.location.assign('app.html');
}

function logout() {
  sessionStorage.removeItem('sw_session_user');
  localStorage.removeItem('sw_session_user');
  window.location.assign('index.html');
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) { return {}; }
}

function applyUserRole() {
  const sessionUser = JSON.parse(sessionStorage.getItem('sw_session_user')) || 
                      JSON.parse(localStorage.getItem('sw_session_user'));
  const btnAdmin = document.getElementById('btnAdmin');
  
  if (sessionUser && sessionUser.role === "ADMIN") {
    if (btnAdmin) btnAdmin.classList.remove('hidden');
  } else {
    if (btnAdmin) btnAdmin.classList.add('hidden');
    if (typeof app !== 'undefined' && app.setRole) app.setRole('user');
  }
}

// Botón Demo
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