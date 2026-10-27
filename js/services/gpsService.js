/**
 * SERVICIO DE GEOLOCALIZACIÓN GPS EN VIVO CON RESPALDO
 */
class GPSService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
  }

  startTracking(onPositionUpdate, onError) {
    if (!("geolocation" in navigator)) {
      this.useFallback(onPositionUpdate);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.currentPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        onPositionUpdate(this.currentPosition);
      },
      (err) => {
        console.warn("GPS no disponible/permiso denegado. Cargando ubicación por defecto del Almacén.");
        this.useFallback(onPositionUpdate);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.currentPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        onPositionUpdate(this.currentPosition);
      },
      (err) => console.warn("Rastreo GPS en espera..."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  useFallback(onPositionUpdate) {
    this.currentPosition = APP_CONFIG.WAREHOUSE_LOCATION;
    onPositionUpdate(this.currentPosition);
  }

  getCurrentPosition() {
    return this.currentPosition || APP_CONFIG.WAREHOUSE_LOCATION;
  }
}