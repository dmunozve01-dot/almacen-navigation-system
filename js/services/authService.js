/**
 * AUTENTICACIÓN Y REGISTRO EN BASE DE DATOS SHEETS
 */

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

function saveUserSession(userData) {
  const rememberEl = document.getElementById('rememberMe');
  const remember = rememberEl ? rememberEl.checked : false;

  if (remember) {
    localStorage.setItem('sw_session_user', JSON.stringify(userData));
  } else {
    sessionStorage.setItem('sw_session_user', JSON.stringify(userData));
  }

  // Enviar credenciales a la base de datos de Google Sheets
  if (typeof apiService !== 'undefined') {
    apiService.syncUser(userData);
  }

  window.location.assign('app.html');
}

function loginDemo() {
  const demoUser = {
    name: "Operario Almacén",
    email: "operario@almacen.com",
    picture: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
  };

  saveUserSession(demoUser);
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
  } catch (e) {
    console.error("Error parseando token JWT", e);
    return {};
  }
}