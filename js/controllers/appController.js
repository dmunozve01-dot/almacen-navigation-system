/**
 * CONTROLADOR CON GPS EN VIVO HABILITADO
 */
class AppController {
  constructor() {
    this.storeRepo = new StoreRepository();
    this.gpsService = new GPSService();
    this.map = null;
    this.routePolyline = null;
    this.selectedCoords = null;
    this.tempMarker = null;
    this.userMarker = null;
    this.markersMap = {};
    this.waypoints = [];
  }

  init() {
    if (!document.getElementById('map')) return;
    this.initMap();
    this.waypoints = this.storeRepo.getAll();
    this.renderWaypoints();

    // RASTREO GPS EN TIEMPO REAL REACTIVADO
    this.gpsService.startTracking(
      pos => this.onGPS(pos),
      err => {
        console.warn("GPS no disponible:", err);
        const el = document.getElementById('gpsStatusText');
        if (el) el.innerText = "GPS no disponible - Usando Staging Base";
      }
    );
  }

  initMap() {
    const { lat, lng, zoom } = APP_CONFIG.STAGING_LOCATION;
    if (this.map) this.map.remove();

    this.map = L.map('map', { zoomControl: true, attributionControl: false }).setView([lat, lng], zoom);

    // Mapa satelital/calles de fondo
    L.tileLayer(APP_CONFIG.MAP_TILE_PROVIDER, { maxZoom: 21 }).addTo(this.map);

    // Overlay del croquis del almacén
    L.imageOverlay(
      APP_CONFIG.OVERLAY_IMAGE_URL,
      APP_CONFIG.OVERLAY_BOUNDS,
      { opacity: 0.88, interactive: true }
    ).addTo(this.map);

    // Marcador Fijo del Staging
    const stagingIcon = L.divIcon({
      className: 'staging-icon',
      html: `<div style="background:#dc2626; color:white; font-size:10px; font-weight:bold; padding:3px 6px; border-radius:4px; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.4); text-align:center;">📦 STAGING</div>`
    });
    L.marker([lat, lng], { icon: stagingIcon }).addTo(this.map).bindPopup("<b>Staging Area</b>");

    this.map.on('click', e => this.onClick(e));
    setTimeout(() => this.map && this.map.invalidateSize(), 300);
  }

  onGPS(pos) {
    const el = document.getElementById('gpsStatusText');
    if (el) el.innerText = `GPS Activo (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})`;

    if (!this.map) return;

    // Actualiza o crea el punto azul del operario en vivo
    if (!this.userMarker) {
      const icon = L.divIcon({
        className: 'user-icon',
        html: `<div style="width:16px; height:16px; background:#2563eb; border:2px solid white; border-radius:50%; box-shadow:0 0 8px rgba(0,0,0,0.6);"></div>`
      });
      this.userMarker = L.marker([pos.lat, pos.lng], { icon }).addTo(this.map);
      this.userMarker.bindPopup("<b>Tu Ubicación (GPS)</b>");
    } else {
      this.userMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  centerMapOnWarehouse() {
    const { lat, lng, zoom } = APP_CONFIG.STAGING_LOCATION;
    if (this.map) this.map.setView([lat, lng], zoom);
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
    if (pos) {
      this.selectedCoords = pos;
      document.getElementById('adminCoordsBox').innerText = `Mi GPS: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
      if (this.tempMarker) this.map.removeLayer(this.tempMarker);
      this.tempMarker = L.marker([pos.lat, pos.lng]).addTo(this.map);
    }
  }

  searchAndRoute() {
    const query = document.getElementById('searchInput').value.trim().toUpperCase();
    const target = this.waypoints.find(w => w.code === query);
    const userPos = this.gpsService.getCurrentPosition() || APP_CONFIG.STAGING_LOCATION;

    if (!target) return alert(`Slot ${query} no encontrado.`);

    this.clearCurrentRoute();
    const start = [userPos.lat, userPos.lng];
    const end = [target.lat, target.lng];

    this.routePolyline = L.polyline([start, end], { color: '#2563eb', weight: 5, className: 'gps-animated-route' }).addTo(this.map);
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [40, 40] });

    const dist = Math.round(this.map.distance(start, end));
    document.getElementById('routeInfoCard').classList.remove('hidden');
    document.getElementById('routeDist').innerText = `${dist} metros`;
    document.getElementById('routeTarget').innerText = `${target.code} (${target.zone})`;
  }

  clearCurrentRoute() {
    if (this.routePolyline && this.map) this.map.removeLayer(this.routePolyline);
    document.getElementById('routeInfoCard').classList.add('hidden');
  }

  saveWaypoint() {
    const code = document.getElementById('adminCodeInput').value.trim().toUpperCase();
    const zone = document.getElementById('adminZoneSelect').value;

    if (!this.selectedCoords || !code) return alert("Selecciona una posición e ingresa el código.");

    this.waypoints = this.storeRepo.saveOrUpdate({
      code, name: `SLOT ${code}`, zone, lat: this.selectedCoords.lat, lng: this.selectedCoords.lng
    });

    this.renderWaypoints();
    alert(`Slot ${code} guardado.`);
  }

  renderWaypoints() {
    if (!this.map) return;
    Object.values(this.markersMap).forEach(m => this.map.removeLayer(m));
    this.markersMap = {};

    const listEl = document.getElementById('waypointsList');
    if (listEl) listEl.innerHTML = '';
    const countEl = document.getElementById('wpCount');
    if (countEl) countEl.innerText = this.waypoints.length;

    this.waypoints.forEach((wp, idx) => {
      const marker = L.marker([wp.lat, wp.lng], {
        icon: L.divIcon({
          className: 'wp-icon',
          html: `<div style="background:#059669; color:white; font-size:10px; padding:2px 5px; border-radius:3px; font-weight:bold;">📍 ${wp.code}</div>`
        })
      }).addTo(this.map);

      this.markersMap[wp.code] = marker;

      if (listEl) {
        const item = document.createElement('div');
        item.className = 'wp-item';
        item.innerHTML = `<strong>${wp.code}</strong> <span>${wp.zone}</span> <button onclick="app.deleteWp(${idx})">🗑️</button>`;
        listEl.appendChild(item);
      }
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
  app = new AppController();
  app.init();
});