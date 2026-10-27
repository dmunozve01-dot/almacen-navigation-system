class GPSService {
  constructor() {
    this.currentPosition = null;
  }
  startTracking(onUpdate, onError) {
    if (!("geolocation" in navigator)) { this.useFallback(onUpdate); return; }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onUpdate(this.currentPosition);
      },
      (err) => { this.useFallback(onUpdate); },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    navigator.geolocation.watchPosition(
      (pos) => {
        this.currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onUpdate(this.currentPosition);
      },
      (err) => console.warn("GPS watch error"),
      { enableHighAccuracy: true }
    );
  }
  useFallback(onUpdate) {
    this.currentPosition = { lat: APP_CONFIG.STAGING_LOCATION.lat, lng: APP_CONFIG.STAGING_LOCATION.lng };
    onUpdate(this.currentPosition);
  }
  getCurrentPosition() {
    return this.currentPosition || { lat: APP_CONFIG.STAGING_LOCATION.lat, lng: APP_CONFIG.STAGING_LOCATION.lng };
  }
}