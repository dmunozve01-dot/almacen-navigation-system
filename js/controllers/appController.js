/**
 * CONTROLADOR PRINCIPAL Y ORQUESTRADOR DEL MAPA
 */
class AppController {
  constructor() {
    this.storeRepo = new StoreRepository();
    this.gpsService = new GPSService();

    this.map = null;
    this.warehouseMarker = null;
    this.userMarker = null;
    this.routePolyline = null;
    this.selectedAdminCoords = null;
    this.tempAdminMarker = null;
    this.markersMap = {};
    this.waypoints = [];
  }

  init() {
    this.initMap();
    this.waypoints = this.storeRepo.getAll();
    this.renderWaypointsOnMap();

    this.gpsService.startTracking(
      (pos) => this.onGPSUpdate(pos),
      (err) => console.warn("GPS Error:", err)
    );
  }

  initMap() {
    const whLat = APP_CONFIG.WAREHOUSE_LOCATION.lat;
    const whLng = APP_CONFIG.WAREHOUSE_LOCATION.lng;
    const zoom = APP_CONFIG.WAREHOUSE_LOCATION.zoom;

    this.map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([whLat, whLng], zoom);

    // Carga de mosaicos del mapa OpenStreetMap
    L.tileLayer(APP_CONFIG.MAP_TILE_PROVIDER, { 
      maxZoom: 19,
      attribution: '© OpenStreetMap' 
    }).addTo(this.map);

    // Marcador Fijo del Almacén Central
    const whIcon = L.divIcon({
      className: 'warehouse-icon',
      html: `<div style="background:#dc2626; color:white; font-size:11px; font-weight:bold; padding:4px 8px; border-radius:4px; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); text-align:center; white-space:nowrap;">🏬 ALMACÉN CENTRAL</div>`
    });

    this.warehouseMarker = L.marker([whLat, whLng], { icon: whIcon }).addTo(this.map);
    this.warehouseMarker.bindPopup(`<b>Almacén Central</b><br>Coordenadas: 8°08'29.9"S 79°00'53.4"W`);

    this.map.on('click', (e) => this.onMapClick(e));

    // REAJUSTE DE DIMENSIONES OBLIGATORIO PARA CELULARES
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 400);
  }

  centerMapOnWarehouse() {
    this.map.setView(
      [APP_CONFIG.WAREHOUSE_LOCATION.lat, APP_CONFIG.WAREHOUSE_LOCATION.lng],
      APP_CONFIG.WAREHOUSE_LOCATION.zoom
    );
    this.warehouseMarker.openPopup();
  }

  onGPSUpdate(pos) {
    const statusText = document.getElementById('gpsStatusText');
    if (statusText) {
      statusText.innerText = `Ubicación Activa: (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})`;
    }

    if (!this.userMarker) {
      const userIcon = L.divIcon({
        className: 'user-gps-icon',
        html: `<div style="width:18px; height:18px; background:#2563eb; border:2px solid white; border-radius:50%; box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>`
      });
      this.userMarker = L.marker([pos.lat, pos.lng], { icon: userIcon }).addTo(this.map);
      this.userMarker.bindPopup("<b>Ubicación del Operario / Almacén</b>");
    } else {
      this.userMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  onMapClick(e) {
    const isAdmin = document.getElementById('btnAdmin').classList.contains('active');
    if (isAdmin) {
      this.selectedAdminCoords = e.latlng;
      document.getElementById('adminCoordsBox').innerText = `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`;
      if (this.tempAdminMarker) this.map.removeLayer(this.tempAdminMarker);
      this.tempAdminMarker = L.marker(e.latlng).addTo(this.map);
    }
  }

  useCurrentGPSForAdmin() {
    const pos = this.gpsService.getCurrentPosition();
    if (pos) {
      this.selectedAdminCoords = pos;
      document.getElementById('adminCoordsBox').innerText = `Lat: ${pos.lat.toFixed(5)}, Lng: ${pos.lng.toFixed(5)} (Mi GPS)`;
      if (this.tempAdminMarker) this.map.removeLayer(this.tempAdminMarker);
      this.tempAdminMarker = L.marker([pos.lat, pos.lng]).addTo(this.map);
    }
  }

  searchAndRoute() {
    const query = document.getElementById('searchInput').value.trim().toUpperCase();
    const target = this.waypoints.find(w => w.code === query);
    const userPos = this.gpsService.getCurrentPosition() || APP_CONFIG.WAREHOUSE_LOCATION;

    if (!target) return alert(`La posición o tienda ${query} no se encuentra mapeada.`);

    this.clearCurrentRoute();

    const start = [userPos.lat, userPos.lng];
    const end = [target.lat, target.lng];

    this.routePolyline = L.polyline([start, end], {
      color: '#2563eb', weight: 5, className: 'gps-animated-route'
    }).addTo(this.map);

    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [40, 40] });

    const distMeters = this.map.distance(start, end);
    document.getElementById('routeInfoCard').classList.remove('hidden');
    document.getElementById('routeDist').innerText = distMeters > 1000 ? `${(distMeters / 1000).toFixed(2)} km` : `${Math.round(distMeters)} m`;
    document.getElementById('routeTarget').innerText = `${target.code} (${target.zone})`;
  }

  clearCurrentRoute() {
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    document.getElementById('routeInfoCard').classList.add('hidden');
  }

  saveWaypoint() {
    const code = document.getElementById('adminCodeInput').value.trim().toUpperCase();
    const zone = document.getElementById('adminZoneSelect').value;

    if (!this.selectedAdminCoords || !code) return alert("Selecciona un punto en el mapa e ingresa un código.");

    const newWp = {
      code,
      name: `TIENDA ${code}`,
      zone,
      lat: this.selectedAdminCoords.lat,
      lng: this.selectedAdminCoords.lng
    };

    this.waypoints = this.storeRepo.saveOrUpdate(newWp);
    this.renderWaypointsOnMap();
    alert(`Posición ${code} guardada correctamente.`);
  }

  renderWaypointsOnMap() {
    Object.values(this.markersMap).forEach(m => this.map.removeLayer(m));
    this.markersMap = {};

    const listEl = document.getElementById('waypointsList');
    listEl.innerHTML = '';
    document.getElementById('wpCount').innerText = this.waypoints.length;

    this.waypoints.forEach((wp, idx) => {
      const marker = L.marker([wp.lat, wp.lng], {
        icon: L.divIcon({
          className: 'wp-icon',
          html: `<div style="background:#059669; color:white; font-size:10px; padding:2px 5px; border-radius:3px; font-weight:bold;">${wp.code}</div>`
        })
      }).addTo(this.map);

      this.markersMap[wp.code] = marker;

      const item = document.createElement('div');
      item.className = 'wp-item';
      item.innerHTML = `<strong>${wp.code}</strong> <span>${wp.zone}</span> <button onclick="app.deleteWp(${idx})">🗑️</button>`;
      listEl.appendChild(item);
    });
  }

  deleteWp(idx) {
    this.waypoints = this.storeRepo.delete(idx);
    this.renderWaypointsOnMap();
  }

  setRole(role) {
    document.getElementById('btnAdmin').classList.toggle('active', role === 'admin');
    document.getElementById('btnUser').classList.toggle('active', role === 'user');
    document.getElementById('adminPanel').classList.toggle('active', role === 'admin');
    document.getElementById('userPanel').classList.toggle('active', role === 'user');

    // Forzar recalculo de lienzo al cambiar de pestaña
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 200);
  }

  handleSearchKeyPress(e) { if (e.key === 'Enter') this.searchAndRoute(); }
}

const app = new AppController();
window.onload = () => app.init();