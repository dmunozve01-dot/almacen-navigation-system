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
        this.currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onPositionUpdate(this.currentPosition);
      },
      (err) => {
        console.warn("GPS denegado. Usando base.");
        this.useFallback(onPositionUpdate);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onPositionUpdate(this.currentPosition);
      },
      (err) => console.warn("Rastreo GPS en espera..."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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