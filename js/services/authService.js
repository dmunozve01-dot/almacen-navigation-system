function checkAppSession() {
  const sessionUser = JSON.parse(sessionStorage.getItem('sw_session_user')) || 
                      JSON.parse(localStorage.getItem('sw_session_user'));

  if (!sessionUser) {
    window.location.assign('index.html');
    return;
  }

  document.getElementById('userName').innerText = sessionUser.name || "Usuario";
  document.getElementById('userEmail').innerText = sessionUser.email || "Sin correo";
  if (sessionUser.picture) document.getElementById('userAvatar').src = sessionUser.picture;
  
  // CONFIGURAR BOTÓN DE SALIR AQUÍ (A prueba de fallos)
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('sw_session_user');
      localStorage.removeItem('sw_session_user');
      window.location.href = 'index.html';
    });
  }

  // Mostrar Admin si corresponde
  if (sessionUser.role === 'ADMIN') {
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) btnAdmin.classList.remove('hidden');
  }
}

function handleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  saveUserSession({ name: payload.name, email: payload.email, picture: payload.picture });
}

async function saveUserSession(userData) {
  const remember = document.getElementById('rememberMe')?.checked || false;
  let role = "USER";
  
  if (typeof apiService !== 'undefined') {
    role = await apiService.getUserRole(userData.email);
    userData.role = role;
    apiService.syncUser(userData); 
  }

  if (remember) localStorage.setItem('sw_session_user', JSON.stringify(userData));
  else sessionStorage.setItem('sw_session_user', JSON.stringify(userData));

  window.location.href = 'app.html';
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
  } catch (e) { return {}; }
}

// Inicializar el botón demo de forma segura
document.addEventListener('DOMContentLoaded', () => {
  const btnDemo = document.getElementById('btnDemoLogin');
  if (btnDemo) {
    btnDemo.addEventListener('click', async (e) => {
      e.preventDefault();
      await saveUserSession({
        name: "Operario Demo",
        email: "operario@almacen.com",
        picture: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
      });
    });
  }
});