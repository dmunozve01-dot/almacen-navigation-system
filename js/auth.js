// Variables globales
window.handleCredentialResponse = function(response) {
  const payload = parseJwt(response.credential);
  saveUserSession({ name: payload.name, email: payload.email, picture: payload.picture });
};

function checkSessionAndLoadUI() {
  const user = JSON.parse(sessionStorage.getItem('sw_user')) || JSON.parse(localStorage.getItem('sw_user'));
  if (!user) { window.location.href = 'index.html'; return; }

  document.getElementById('userName').innerText = user.name;
  document.getElementById('userEmail').innerText = user.email;
  if(user.picture) document.getElementById('userAvatar').src = user.picture;

  // Activar botón salir
  document.getElementById('btnLogout').addEventListener('click', () => {
    sessionStorage.removeItem('sw_user');
    localStorage.removeItem('sw_user');
    window.location.href = 'index.html';
  });

  // Mostrar Admin si aplica
  if (user.role === 'ADMIN') {
    document.getElementById('btnAdmin').classList.remove('hidden');
  }
}

async function saveUserSession(userData) {
  const remember = document.getElementById('rememberMe')?.checked || false;
  
  let role = "USER";
  if (typeof apiService !== 'undefined') {
    role = await apiService.getUserRole(userData.email);
    userData.role = role;
    apiService.syncUser(userData); 
  }

  if (remember) localStorage.setItem('sw_user', JSON.stringify(userData));
  else sessionStorage.setItem('sw_user', JSON.stringify(userData));

  window.location.href = 'app.html';
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
  } catch (e) { return {}; }
}

// Botón Demo
document.addEventListener('DOMContentLoaded', () => {
  const btnDemo = document.getElementById('btnDemoLogin');
  if (btnDemo) {
    btnDemo.addEventListener('click', (e) => {
      e.preventDefault();
      saveUserSession({ name: "Operario Demo", email: "operario@almacen.com", picture: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" });
    });
  }
});