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
    if (!user) { window.location.replace('index.html'); return; }

    // 2. Cargar UI (Nombre, botón salir, roles)
    checkSessionAndLoadUI();
    
    // 3. Configurar botones y Mapa
    this.setupListeners();
    this.initMap();
    
    // 4. Iniciar GPS
    this.gpsService.startTracking(pos => this.updateGPS(pos), err => console.warn("GPS offline"));
    
    // 5. Cargar Slots de Google Sheets
    this.waypoints = await this.storeRepo.loadFromCloud();
    this.drawSlots();
  }

  setupListeners() {
    document.getElementById('btnUser').addEventListener('click', () => this.switchMode('user'));
    document.getElementById('btnAdmin').addEventListener('click', () => this.switchMode('admin'));
    document.getElementById('btnCenterMap').addEventListener('click', () => this.centerMap());
    document.getElementById('btnSearchRoute').addEventListener('click', () => this.traceRoute());
    document.getElementById('btnClearRoute').addEventListener('click', () => this.clearRoute());
    document.getElementById('btnSaveWaypoint').addEventListener('click', () => this.saveSlot());
    
    // Escuchar el Enter en el buscador
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.traceRoute();
    });
  }

  initMap() {
    const { lat, lng, zoom } = APP_CONFIG.STAGING_LOCATION;
    this.map = L.map('map', { zoomControl: true }).setView([lat, lng], zoom);
    L.tileLayer(APP_CONFIG.MAP_TILE_PROVIDER, { maxZoom: 21 }).addTo(this.map);
    
    // Plano del almacén superpuesto
    L.imageOverlay(APP_CONFIG.OVERLAY_IMAGE_URL, APP_CONFIG.OVERLAY_BOUNDS, { opacity: 0.9 }).addTo(this.map);

    // Evento de clic en el mapa (solo actúa si estamos en Modo Admin)
    this.map.on('click', (e) => {
      if (!document.getElementById('btnAdmin').classList.contains('active')) return;
      
      this.selectedCoords = e.latlng;
      document.getElementById('adminCoordsBox').innerText = `Lat: ${e.latlng.lat.toFixed(6)}, Lng: ${e.latlng.lng.toFixed(6)}`;
      
      if (this.tempMarker) this.map.removeLayer(this.tempMarker);
      
      // Pin temporal de color rojo donde se hizo clic
      this.tempMarker = L.marker(e.latlng, {
        icon: L.divIcon({ className: 'temp-icon', html: `<div style="background:red; width:14px; height:14px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px black;"></div>` })
      }).addTo(this.map);
    });

    // Asegurar que el mapa se dibuje bien
    setTimeout(() => this.map.invalidateSize(), 300);
  }

  updateGPS(pos) {
    document.getElementById('gpsStatusText').innerText = `GPS: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
    
    // Si no hay marcador de usuario, lo creamos
    if (!this.userMarker) {
      const icon = L.divIcon({
        className: 'user-icon',
        html: `<div style="width:16px; height:16px; background:#2563eb; border:3px solid white; border-radius:50%; box-shadow: 0 0 10px rgba(37, 99, 235, 0.8);"></div>`
      });
      this.userMarker = L.marker([pos.lat, pos.lng], { icon }).addTo(this.map).bindPopup("📍 Tu ubicación actual");
      
      // NOTA: NO usamos flyTo aquí. El mapa se queda en el almacén.
      // Si estás en el almacén, el punto azul aparecerá dentro del plano.
      
    } else {
      // Si ya existe, actualizamos su posición si te mueves
      this.userMarker.setLatLng([pos.lat, pos.lng]);
    }
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
    // Limpiar marcadores viejos
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

    // Tu ubicación GPS real
    const start = this.gpsService.getCurrentPosition();
    this.clearRoute();

    // Trazar la línea punteada desde ti hasta el slot
    this.routeLine = L.polyline([[start.lat, start.lng], [target.lat, target.lng]], { 
      color: '#2563eb', 
      weight: 6, 
      dashArray: '10, 10', 
      lineCap: 'round' 
    }).addTo(this.map);

    // Zoom para ver la ruta completa
    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
    
    // Forzar un zoom alto para que se vea el interior del almacén
    setTimeout(() => { this.map.setZoom(20); }, 1000);
    
    alert(`Ruta trazada hacia el Slot ${target.code}`);
  }

  clearRoute() {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }
  }

  saveSlot() {
    const code = document.getElementById('adminCodeInput').value.trim().toUpperCase();
    const zone = document.getElementById('adminZoneSelect').value;

    if (!this.selectedCoords || !code) return alert("Selecciona una ubicación en el mapa y escribe un código.");

    this.waypoints = this.storeRepo.saveOrUpdate({
      code: code, 
      name: `Slot ${code}`, 
      zone: zone, 
      lat: this.selectedCoords.lat, 
      lng: this.selectedCoords.lng
    });

    this.drawSlots();
    
    // Limpiar formulario
    document.getElementById('adminCodeInput').value = '';
    document.getElementById('adminCoordsBox').innerText = 'Lat: - , Lng: -';
    if (this.tempMarker) this.map.removeLayer(this.tempMarker);

    alert(`✅ Slot ${code} guardado en el mapa.`);
  }
}

// Iniciar la App
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    const app = new AppController();
    app.init();
  }
});