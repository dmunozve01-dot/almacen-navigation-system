class AppController {
  constructor() {
    this.storeRepo = new StoreRepository();
    this.gpsService = new GPSService();
    this.map = null;
    this.routeLine = null;
    this.userMarker = null;
    this.tempMarker = null;
    this.slotMarkers = [];
    this.waypoints = [];
    this.capturedCoords = null; // Aquí guardaremos las coordenadas exactas al presionar el botón
  }

  async init() {
    const user = JSON.parse(sessionStorage.getItem('sw_user')) || JSON.parse(localStorage.getItem('sw_user'));
    if (!user) { window.location.replace('index.html'); return; }

    checkSessionAndLoadUI();
    this.setupListeners();
    this.initMap();
    
    // Iniciar rastreo GPS (actualiza el punto azul en el mapa)
    this.gpsService.startTracking(pos => this.updateGPS(pos), err => console.warn("GPS offline"));
    
    // Cargar Slots guardados desde Google Sheets
    this.waypoints = await this.storeRepo.loadFromCloud();
    this.drawSlots();
  }

  setupListeners() {
    document.getElementById('btnUser').addEventListener('click', () => this.switchMode('user'));
    document.getElementById('btnAdmin').addEventListener('click', () => this.switchMode('admin'));
    document.getElementById('btnCenterMap').addEventListener('click', () => this.centerMap());
    document.getElementById('btnSearchRoute').addEventListener('click', () => this.traceRoute());
    document.getElementById('btnClearRoute').addEventListener('click', () => this.clearRoute());
    
    // Botón mágico para capturar GPS sin dar clics en el mapa
    document.getElementById('btnCaptureGPS').addEventListener('click', () => this.captureCurrentGPS());
    document.getElementById('btnSaveWaypoint').addEventListener('click', () => this.saveSlot());
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.traceRoute();
    });
  }

  initMap() {
    const { lat, lng, zoom } = APP_CONFIG.STAGING_LOCATION;
    this.map = L.map('map', { zoomControl: true }).setView([lat, lng], zoom);
    L.tileLayer(APP_CONFIG.MAP_TILE_PROVIDER, { maxZoom: 21 }).addTo(this.map);
    
    // Plano del almacén
    L.imageOverlay(APP_CONFIG.OVERLAY_IMAGE_URL, APP_CONFIG.OVERLAY_BOUNDS, { opacity: 0.9 }).addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 300);
  }

  updateGPS(pos) {
    document.getElementById('gpsStatusText').innerText = `GPS: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
    
    // Pintamos tu ubicación actual en tiempo real
    if (!this.userMarker) {
      const icon = L.divIcon({
        className: 'user-icon',
        html: `<div style="width:16px; height:16px; background:#2563eb; border:3px solid white; border-radius:50%; box-shadow: 0 0 10px rgba(37, 99, 235, 0.8);"></div>`
      });
      this.userMarker = L.marker([pos.lat, pos.lng], { icon }).addTo(this.map).bindPopup("📍 Estás aquí");
    } else {
      this.userMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  captureCurrentGPS() {
    // Obtiene la latitud y longitud exactas de tu hardware GPS
    const pos = this.gpsService.getCurrentPosition();
    this.capturedCoords = pos;

    // Mostramos los datos con 6 decimales (precisión centimétrica)
    document.getElementById('adminCoordsBox').innerText = `📍 Capturado: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
    document.getElementById('adminCoordsBox').style.color = "#16a34a"; // Color verde
    
    // Hacemos zoom en el mapa para que veas exactamente dónde se guardará
    this.map.setView([pos.lat, pos.lng], 21);
    
    if (this.tempMarker) this.map.removeLayer(this.tempMarker);
    this.tempMarker = L.marker([pos.lat, pos.lng], {
      icon: L.divIcon({ className: 'temp-icon', html: `<div style="background:red; width:14px; height:14px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px black;"></div>` })
    }).addTo(this.map);
  }

  saveSlot() {
    const code = document.getElementById('adminCodeInput').value.trim().toUpperCase();
    const zone = document.getElementById('adminZoneSelect').value;

    if (!this.capturedCoords) return alert("⚠️ Primero debes hacer clic en 'Capturar Mi Ubicación'.");
    if (!code) return alert("Escribe un código para el slot.");

    // Guardamos usando las coordenadas exactas que capturó el botón
    this.waypoints = this.storeRepo.saveOrUpdate({
      code: code, 
      name: `Slot ${code}`, 
      zone: zone, 
      lat: this.capturedCoords.lat, 
      lng: this.capturedCoords.lng
    });

    this.drawSlots();
    
    // Limpiamos el formulario para mapear el siguiente
    document.getElementById('adminCodeInput').value = '';
    document.getElementById('adminCoordsBox').innerText = 'Esperando captura...';
    document.getElementById('adminCoordsBox').style.color = "#64748b";
    this.capturedCoords = null; 
    if (this.tempMarker) this.map.removeLayer(this.tempMarker);

    alert(`✅ Slot ${code} guardado con éxito.`);
  }

  centerMap() {
    const { lat, lng, zoom } = APP_CONFIG.STAGING_LOCATION;
    this.map.setView([lat, lng], zoom);
  }

  switchMode(mode) {
    document.getElementById('btnUser').classList.toggle('active', mode === 'user');
    document.getElementById('btnAdmin').classList.toggle('active', mode === 'admin');
    document.getElementById('userPanel').classList.toggle('active', mode === 'user');
    document.getElementById('adminPanel').classList.toggle('active', mode === 'admin');
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  drawSlots() {
    this.slotMarkers.forEach(m => this.map.removeLayer(m));
    this.slotMarkers = [];

    this.waypoints.forEach(wp => {
      const marker = L.marker([wp.lat, wp.lng], {
        icon: L.divIcon({ 
          className: 'slot-icon', 
          html: `<div style="background:#059669; color:white; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:12px; border:2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">📍 ${wp.code}</div>` 
        })
      }).addTo(this.map);
      this.slotMarkers.push(marker);
    });
  }

  traceRoute() {
    const query = document.getElementById('searchInput').value.trim().toUpperCase();
    const target = this.waypoints.find(w => w.code === query);
    if (!target) return alert("Slot no encontrado. Verifica el código.");

    const start = this.gpsService.getCurrentPosition();
    this.clearRoute();

    // Línea punteada azul desde ti hasta la estantería
    this.routeLine = L.polyline([[start.lat, start.lng], [target.lat, target.lng]], { 
      color: '#2563eb', weight: 6, dashArray: '10, 10', lineCap: 'round' 
    }).addTo(this.map);

    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
    setTimeout(() => { this.map.setZoom(20); }, 1000);
  }

  clearRoute() {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    const app = new AppController();
    app.init();
  }
});