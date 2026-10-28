class GPSService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
  }

  startTracking(onPositionUpdate, onError) {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocalización no soportada.");
      this.useFallback(onPositionUpdate);
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // 1. FILTRO DE PRECISIÓN: Ignorar si el error es mayor a 8 metros
        // (En interiores el GPS tiene mucho ruido, esto estabiliza el punto)
        if (pos.coords.accuracy > 8) {
          return; 
        }

        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;

        if (!this.currentPosition) {
          this.currentPosition = { lat: newLat, lng: newLng };
          onPositionUpdate(this.currentPosition);
          return;
        }

        // 2. FILTRO DE DISTANCIA: Si te moviste menos de 1.5 metros, ignorar.
        // Esto evita el "baile" cuando estás parado.
        const dist = this.calculateDistance(this.currentPosition.lat, this.currentPosition.lng, newLat, newLng);
        if (dist < 1.5) {
          return;
        }

        // 3. SUAVIZADO: Actualización fluida
        this.currentPosition = { lat: newLat, lng: newLng };
        onPositionUpdate(this.currentPosition);
        
      },
      (err) => {
        console.warn("GPS fallando.");
        this.useFallback(onPositionUpdate);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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

  // (Mantenemos la función de captura de alta precisión exactamente igual)
  async captureHighAccuracyPoint() {
    return new Promise((resolve, reject) => {
      let readings = [];
      let attempts = 0;
      const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

      const takeReading = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (pos.coords.accuracy <= 10) { // Solo lecturas buenas
              readings.push({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }
            attempts++;
            if (readings.length >= 10 || attempts >= 15) {
              if (readings.length === 0) return reject(new Error("No se pudo estabilizar el GPS. Ve a un lugar despejado."));
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