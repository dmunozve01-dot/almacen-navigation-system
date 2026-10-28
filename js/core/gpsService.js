class GPSService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
  }

  startTracking(onPositionUpdate, onError) {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocalización no soportada.");
      document.getElementById('gpsStatusText').innerText = "GPS no soportado en este dispositivo";
      this.useFallback(onPositionUpdate);
      return;
    }

    // Forzar un estado visual inicial
    document.getElementById('gpsStatusText').innerText = "Conectando con satélites...";

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // 1. Si es la primera vez, guardamos y mostramos
        if (!this.currentPosition) {
          this.currentPosition = { lat: newLat, lng: newLng, acc: accuracy };
          onPositionUpdate(this.currentPosition);
          return;
        }

        // 2. Filtro de distancia: Si te moviste menos de 2 metros, ignorar.
        // Aumentamos a 2m para evitar el baile.
        const dist = this.calculateDistance(this.currentPosition.lat, this.currentPosition.lng, newLat, newLng);
        
        if (dist < 2 && accuracy > 10) {
           // Si estamos quietos y la precisión no es perfecta, actualizamos solo el texto de estado (sin mover el pin)
           document.getElementById('gpsStatusText').innerText = `GPS Estable (Precisión: ${Math.round(accuracy)}m)`;
           return;
        }

        // 3. Actualización si nos movimos o si la precisión es muy buena
        this.currentPosition = { lat: newLat, lng: newLng, acc: accuracy };
        onPositionUpdate(this.currentPosition);
      },
      (err) => {
        console.warn("GPS fallando o denegado:", err);
        document.getElementById('gpsStatusText').innerText = "GPS denegado (Usando Staging)";
        this.useFallback(onPositionUpdate);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

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

  // Función de captura manual (la que usa el botón del Admin)
  async captureHighAccuracyPoint() {
    return new Promise((resolve, reject) => {
      let readings = [];
      let attempts = 0;
      const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

      const takeReading = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // Aceptamos lecturas de hasta 20 metros para interiores
            if (pos.coords.accuracy <= 20) { 
              readings.push({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }
            attempts++;
            
            // Si tenemos 10 lecturas o fallamos 15 veces, terminamos
            if (readings.length >= 10 || attempts >= 15) {
              if (readings.length === 0) return reject(new Error("No se pudo estabilizar el GPS. Acércate a una ventana o sal al exterior."));
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
    this.currentPosition = { lat: APP_CONFIG.STAGING_LOCATION.lat, lng: APP_CONFIG.STAGING_LOCATION.lng, acc: 999 };
    onPositionUpdate(this.currentPosition);
  }

  getCurrentPosition() {
    return this.currentPosition || { lat: APP_CONFIG.STAGING_LOCATION.lat, lng: APP_CONFIG.STAGING_LOCATION.lng };
  }
}