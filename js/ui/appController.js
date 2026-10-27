class AppController {
  constructor() {
    this.storeRepo = new StoreRepository();
    this.gpsService = new GPSService();
    this.map = null;
    this.routeLine = null;
    this.tempMarker = null;
    this.userMarker = null;
    this.slotMarkers = [];
    this.waypoints = [];
    this.selectedCoords = null;
  }

  async init() {
    // 1. Validar sesión
    const user = JSON.parse(sessionStorage.getItem('sw_user')) || JSON.parse(localStorage.getItem('sw_user'));
    if (!user) { window.location.href = 'index.html'; return; }

    // 2. Cargar UI
    checkSessionAndLoadUI();
    this.setupListeners();
    
    // 3. Iniciar Mapa y GPS
    this.initMap();
    this.gpsService.startTracking(pos => this.updateGPS(pos), err => console.warn("GPS offline"));
    
    // 4. Cargar Slots de Google Sheets
    this.waypoints = await this.storeRepo.loadFromCloud();
    this.drawSlots();
  }

  setupListeners() {
    document.getElementById('btnUser').addEventListener('click', () => this.switchMode('user'));
    document.getElementById('btnAdmin').addEventListener('click', () => this.switchMode('admin'));
    document.getElementById('btnCenterMap').addEventListener('click', () => this.map.setView([APP_CONFIG.STAGING_LOCATION.lat, APP_CONFIG.STAGING_LOCATION.lng], APP_CONFIG.STAGING_LOCATION.zoom));
    document.getElementById('btnSearchRoute').addEventListener('click', () => this.traceRoute());
    document.getElementById('btnClearRoute').addEventListener('click', () => this.clearRoute());
    document.getElementById('btnSaveWaypoint').addEventListener('click', () => this.saveSlot());
  }

  initMap() {
    const { lat, lng, zoom } = APP_CONFIG.STAGING_LOCATION;
    this.map = L.map('map', { zoomControl: true }).setView([lat, lng], zoom);
    L.tileLayer(APP_CONFIG.MAP_TILE_PROVIDER, { maxZoom: 21 }).addTo(this.map);
    
    // Plano del almacén
    L.imageOverlay(APP_CONFIG.OVERLAY_IMAGE_URL, APP_CONFIG.OVERLAY_BOUNDS, { opacity: 0.8 }).addTo(this.map);

    // Evento clic en el mapa (solo si es Admin)
    this.map.on('click', (e) => {
      if (!document.getElementById('btnAdmin').classList.contains('active')) return;
      this.selectedCoords = e.latlng;
      document.getElementById('adminCoordsBox').innerText = `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`;
      if (this.tempMarker) this.map.removeLayer(this.tempMarker);
      this.tempMarker = L.marker(e.latlng).addTo(this.map);
    });

    setTimeout(() => this.map.invalidateSize(), 300);
  }

  updateGPS(pos) {
    document.getElementById('gpsStatusText').innerText = `GPS: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
    if (!this.userMarker) {
      this.userMarker = L.marker([pos.lat, pos.lng]).addTo(this.map).bindPopup("Tu ubicación");
    } else {
      this.userMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  switchMode(mode) {
    document.getElementById('btnUser').classList.toggle('active', mode === 'user');
    document.getElementById('btnAdmin').classList.toggle('active', mode === 'admin');
    document.getElementById('userPanel').classList.toggle('active', mode === 'user');
    document.getElementById('adminPanel').classList.toggle('active', mode === 'admin');
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  drawSlots() {
    // Limpiar marcadores viejos
    this.slotMarkers.forEach(m => this.map.removeLayer(m));
    this.slotMarkers = [];

    this.waypoints.forEach(wp => {
      const marker = L.marker([wp.lat, wp.lng], {
        icon: L.divIcon({ className: 'slot-icon', html: `<b>📍 ${wp.code}</b>` })
      }).addTo(this.map);
      this.slotMarkers.push(marker);
    });
  }

  traceRoute() {
    const query = document.getElementById('searchInput').value.trim().toUpperCase();
    const target = this.waypoints.find(w => w.code === query);
    if (!target) return alert("Slot no encontrado");

    const start = this.gpsService.getCurrentPosition();
    this.clearRoute();

    this.routeLine = L.polyline([[start.lat, start.lng], [target.lat, target.lng]], { color: '#2563eb', weight: 5, dashArray: '8,8' }).addTo(this.map);
    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  clearRoute() {
    if (this.routeLine) this.map.removeLayer(this.routeLine);
  }

  saveSlot() {
    const code = document.getElementById('adminCodeInput').value.trim().toUpperCase();
    const zone = document.getElementById('adminZoneSelect').value;

    if (!this.selectedCoords || !code) return alert("Selecciona una ubicación en el mapa y escribe un código.");

    this.waypoints = this.storeRepo.saveOrUpdate({
      code, name: `Slot ${code}`, zone, lat: this.selectedCoords.lat, lng: this.selectedCoords.lng
    });

    this.drawSlots();
    alert(`Slot ${code} guardado.`);
  }
}

// Iniciar la App
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    const app = new AppController();
    app.init();
  }
});