class GPSService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
  }

  startTracking(onPositionUpdate, onError) {
    const gpsText = document.getElementById('gpsStatusText');
    
    if (!("geolocation" in navigator)) {
      if (gpsText) gpsText.innerText = "GPS no soportado en este dispositivo";
      this.useFallback(onPositionUpdate);
      return;
    }

    if (gpsText) gpsText.innerText = "Conectando con satélites...";

    // 1. Disparo inmediato: Fuerza al celular a buscar señal apenas abre la app
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onPositionUpdate(this.currentPosition);
        if (gpsText) gpsText.innerText = `GPS Activo (Precisión: ${Math.round(pos.coords.accuracy)}m)`;
      },
      (err) => {
        console.warn("Esperando permiso o señal GPS...");
        if (gpsText) gpsText.innerText = "Esperando permiso de ubicación...";
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // 2. Rastreo continuo en tiempo real
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;

        if (!this.currentPosition) {
          this.currentPosition = { lat: newLat, lng: newLng };
          onPositionUpdate(this.currentPosition);
          if (gpsText) gpsText.innerText = `GPS Activo (Precisión: ${Math.round(pos.coords.accuracy)}m)`;
          return;
        }

        // Filtro anti-baile: Si se movió menos de 2 metros, no mueve el pin
        const dist = this.calculateDistance(this.currentPosition.lat, this.currentPosition.lng, newLat, newLng);
        if (dist < 2) return; 

        this.currentPosition = { lat: newLat, lng: newLng };
        onPositionUpdate(this.currentPosition);
        if (gpsText) gpsText.innerText = `GPS Activo (Precisión: ${Math.round(pos.coords.accuracy)}m)`;
      },
      (err) => {
        if (gpsText) gpsText.innerText = "GPS denegado o sin señal";
        this.useFallback(onPositionUpdate);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // Función matemática para calcular distancia
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Captura de alta precisión (Promediado para el Admin)
  async captureHighAccuracyPoint() {
    return new Promise((resolve, reject) => {
      let readings = [];
      let attempts = 0;
      const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

      const takeReading = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (pos.coords.accuracy <= 20) { 
              readings.push({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }
            attempts++;
            if (readings.length >= 10 || attempts >= 15) {
              if (readings.length === 0) return reject(new Error("No se pudo estabilizar el GPS. Sal al exterior o espera unos segundos."));
              let sumLat = 0, sumLng = 0;
              readings.forEach(r => { sumLat += r.lat; sumLng += r.lng; });
              resolve({ lat: sumLat / readings.length, lng: sumLng / readings.length });
            } else {
              setTimeout(takeReading, 300);
            }
          },
          (err) => {
            attempts++;
            if (attempts >= 15) reject(err);
            else setTimeout(takeReading, 500);
          },
          options
        );
      };
      takeReading();
    });
  }

  useFallback(onPositionUpdate) {
    this.currentPosition = { lat: APP_CONFIG.STAGING_LOCATION.lat, lng: APP_CONFIG.STAGING_LOCATION.lng };
    onPositionUpdate(this.currentPosition);
  }

  getCurrentPosition() {
    return this.currentPosition || { lat: APP_CONFIG.STAGING_LOCATION.lat, lng: APP_CONFIG.STAGING_LOCATION.lng };
  }
}