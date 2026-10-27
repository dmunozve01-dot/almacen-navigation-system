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

    // 1. Obtener ubicación inicial de alta precisión
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onPositionUpdate(this.currentPosition);
      },
      (err) => {
        console.warn("GPS denegado o fallando.");
        this.useFallback(onPositionUpdate);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 2. Rastreo continuo
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onPositionUpdate(this.currentPosition);
      },
      (err) => console.warn("Rastreo en espera..."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  useFallback(onPositionUpdate) {
    // Si falla el GPS, forzamos las coordenadas del Staging
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