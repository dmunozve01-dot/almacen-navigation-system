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

    // Rastreo continuo para el punto azul en el mapa
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onPositionUpdate(this.currentPosition);
      },
      (err) => {
        console.warn("GPS denegado o fallando.");
        this.useFallback(onPositionUpdate);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  // --- NUEVA FUNCIÓN: Captura de Alta Precisión ---
  async captureHighAccuracyPoint() {
    return new Promise((resolve, reject) => {
      let readings = [];
      const MAX_READINGS = 10; // Tomaremos 10 lecturas
      let attempts = 0;

      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Damos hasta 15 segundos
        maximumAge: 0   // Forzar lectura nueva, no usar caché
      };

      const takeReading = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // Solo guardamos lecturas con precisión aceptable (ej. menos de 20 metros de error)
            if (pos.coords.accuracy <= 20) {
              readings.push({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              });
            }
            
            attempts++;

            // Si ya tenemos suficientes lecturas buenas, o agotamos los intentos
            if (readings.length >= MAX_READINGS || attempts >= 15) {
              if (readings.length === 0) {
                return reject(new Error("No se pudieron obtener lecturas GPS precisas. Acércate a una ventana o sal al exterior."));
              }

              // Calcular el promedio (centro del círculo de error)
              let sumLat = 0, sumLng = 0;
              readings.forEach(r => {
                sumLat += r.lat;
                sumLng += r.lng;
              });

              resolve({
                lat: sumLat / readings.length,
                lng: sumLng / readings.length,
                readingsCount: readings.length
              });
            } else {
              // Esperar 300ms antes de la siguiente lectura para no saturar
              setTimeout(takeReading, 300);
            }
          },
          (err) => {
            attempts++;
            if (attempts >= 15) {
              if (readings.length === 0) reject(err);
              else {
                // Resolver con lo que tengamos
                let sumLat = 0, sumLng = 0;
                readings.forEach(r => { sumLat += r.lat; sumLng += r.lng; });
                resolve({ lat: sumLat / readings.length, lng: sumLng / readings.length, readingsCount: readings.length });
              }
            } else {
              setTimeout(takeReading, 500);
            }
          },
          options
        );
      };

      takeReading();
    });
  }

  useFallback(onPositionUpdate) {
    this.currentPosition = {
      lat: APP_CONFIG.STAGING_LOCATION.lat,
      lng: APP_CONFIG.STAGING_LOCATION.lng
    };
    onPositionUpdate(this.currentPosition);
  }

  getCurrentPosition() {
    return this.currentPosition || {
      lat: APP_CONFIG.STAGING_LOCATION.lat,
      lng: APP_CONFIG.STAGING_LOCATION.lng
    };
  }
}