class AppController {
  constructor() {
    this.storeRepo = new StoreRepository();
    this.gpsService = new GPSService();
    this.waypoints = [];
  }

  async init() {
    this.initMap();
    this.waypoints = await this.storeRepo.loadFromCloud();
    this.renderWaypoints();
    this.setupListeners(); // <--- Enlazamos los botones aquí
    this.gpsService.startTracking(pos => this.onGPS(pos), err => console.warn(err));
  }

  setupListeners() {
    document.getElementById('btnUser').addEventListener('click', () => this.setRole('user'));
    document.getElementById('btnAdmin').addEventListener('click', () => this.setRole('admin'));
    document.getElementById('btnCenterMap').addEventListener('click', () => this.centerMapOnWarehouse());
    document.getElementById('btnSearchRoute').addEventListener('click', () => this.searchAndRoute());
    document.getElementById('btnClearRoute').addEventListener('click', () => this.clearCurrentRoute());
    document.getElementById('btnCaptureGPS').addEventListener('click', () => this.useCurrentGPSForAdmin());
    document.getElementById('btnSaveWaypoint').addEventListener('click', () => this.saveWaypoint());
    document.getElementById('searchInput').addEventListener('keypress', (e) => this.handleSearchKeyPress(e));
  }

  initMap() {
    const { lat, lng, zoom } = APP_CONFIG.STAGING_LOCATION;
    this.map = L.map('map', { zoomControl: true, attributionControl: false }).setView([lat, lng], zoom);
    L.tileLayer(APP_CONFIG.MAP_TILE_PROVIDER, { maxZoom: 21 }).addTo(this.map);
    L.imageOverlay(APP_CONFIG.OVERLAY_IMAGE_URL, APP_CONFIG.OVERLAY_BOUNDS, { opacity: 0.88, interactive: true }).addTo(this.map);
    
    const stagingIcon = L.divIcon({ className: 'staging-icon', html: `<div style="background:#dc2626; color:white; padding:4px; border-radius:4px;">📦 STAGING</div>` });
    L.marker([lat, lng], { icon: stagingIcon }).addTo(this.map);
    this.map.on('click', e => this.onClick(e));
    setTimeout(() => this.map && this.map.invalidateSize(), 300);
  }

  onGPS(pos) {
    document.getElementById('gpsStatusText').innerText = `GPS Activo (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`;
    if (!this.userMarker) {
      this.userMarker = L.marker([pos.lat, pos.lng]).addTo(this.map);
    } else {
      this.userMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  centerMapOnWarehouse() {
    this.map.setView([APP_CONFIG.STAGING_LOCATION.lat, APP_CONFIG.STAGING_LOCATION.lng], APP_CONFIG.STAGING_LOCATION.zoom);
  }

  onClick(e) {
    if (!document.getElementById('btnAdmin').classList.contains('active')) return;
    this.selectedCoords = e.latlng;
    document.getElementById('adminCoordsBox').innerText = `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`;
    if (this.tempMarker) this.map.removeLayer(this.tempMarker);
    this.tempMarker = L.marker(e.latlng).addTo(this.map);
  }

  useCurrentGPSForAdmin() {
    const pos = this.gpsService.getCurrentPosition();
    this.selectedCoords = pos;
    document.getElementById('adminCoordsBox').innerText = `Mi GPS: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
    if (this.tempMarker) this.map.removeLayer(this.tempMarker);
    this.tempMarker = L.marker([pos.lat, pos.lng]).addTo(this.map);
  }

  searchAndRoute() {
    const query = document.getElementById('searchInput').value.trim().toUpperCase();
    const target = this.waypoints.find(w => w.code === query);
    if (!target) return alert(`Slot ${query} no encontrado.`);
    
    this.clearCurrentRoute();
    const userPos = this.gpsService.getCurrentPosition();
    this.routePolyline = L.polyline([[userPos.lat, userPos.lng], [target.lat, target.lng]], { color: '#2563eb', weight: 5, className: 'gps-animated-route' }).addTo(this.map);
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [40, 40] });
    
    document.getElementById('routeInfoCard').classList.remove('hidden');
    document.getElementById('routeDist').innerText = `${Math.round(this.map.distance([userPos.lat, userPos.lng], [target.lat, target.lng]))} m`;
    document.getElementById('routeTarget').innerText = `${target.code} (${target.zone})`;
  }

  clearCurrentRoute() {
    if (this.routePolyline) this.map.removeLayer(this.routePolyline);
    document.getElementById('routeInfoCard').classList.add('hidden');
  }

  saveWaypoint() {
    const code = document.getElementById('adminCodeInput').value.trim().toUpperCase();
    const zone = document.getElementById('adminZoneSelect').value;
    if (!this.selectedCoords || !code) return alert("Selecciona una posición e ingresa el código.");

    this.waypoints = this.storeRepo.saveOrUpdate({ code, name: `SLOT ${code}`, zone, lat: this.selectedCoords.lat, lng: this.selectedCoords.lng });
    this.renderWaypoints();
    alert(`Slot ${code} guardado.`);
  }

  renderWaypoints() {
    document.getElementById('wpCount').innerText = this.waypoints.length;
    const listEl = document.getElementById('waypointsList');
    listEl.innerHTML = '';
    
    // Limpiar marcadores viejos
    if (this.markersMap) Object.values(this.markersMap).forEach(m => this.map.removeLayer(m));
    this.markersMap = {};

    this.waypoints.forEach((wp, idx) => {
      const marker = L.marker([wp.lat, wp.lng]).addTo(this.map);
      this.markersMap[wp.code] = marker;
      
      const item = document.createElement('div');
      item.className = 'wp-item';
      item.innerHTML = `<strong>${wp.code}</strong> <span>${wp.zone}</span> <button onclick="app.deleteWp(${idx})">🗑️</button>`;
      listEl.appendChild(item);
    });
  }

  deleteWp(idx) {
    this.waypoints = this.storeRepo.delete(idx);
    this.renderWaypoints();
  }

  setRole(role) {
    document.getElementById('btnAdmin').classList.toggle('active', role === 'admin');
    document.getElementById('btnUser').classList.toggle('active', role === 'user');
    document.getElementById('adminPanel').classList.toggle('active', role === 'admin');
    document.getElementById('userPanel').classList.toggle('active', role === 'user');
    setTimeout(() => this.map && this.map.invalidateSize(), 200);
  }

  handleSearchKeyPress(e) { if (e.key === 'Enter') this.searchAndRoute(); }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    app = new AppController();
    app.init();
    checkAppSession(); // Llamamos aquí para que el botón de salir se active
  }
});