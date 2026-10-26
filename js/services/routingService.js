/**
 * SERVICIO DE CÁLCULO DE RUTAS Y TELEMETRÍA
 */
class RoutingService {
  calculateDistanceMeters(mapInstance, latLng1, latLng2) {
    return mapInstance.distance(latLng1, latLng2);
  }

  formatDistance(meters) {
    return meters > 1000 
      ? `${(meters / 1000).toFixed(2)} km` 
      : `${Math.round(meters)} metros`;
  }
}