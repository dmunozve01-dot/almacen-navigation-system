const APP_CONFIG = {
  // Coordenadas fijas del Staging Area (Centro de la Nave)
  STAGING_LOCATION: { lat: -8.141639, lng: -79.014833, zoom: 19 },

  // Imagen del plano del almacén
  OVERLAY_IMAGE_URL: "assets/plano_almacen.jpeg",

  // Coordenadas delimitadoras para centrar el croquis en la nave
  OVERLAY_BOUNDS: [
    [-8.141900, -79.015150], // Esquina inferior izquierda (SO)
    [-8.141380, -79.014500]  // Esquina superior derecha (NE)
  ],
  // Reemplaza con tu Client ID de la Consola de Google Cloud para producción
  GOOGLE_CLIENT_ID: "606508682227-kaoi6vcv5bphorgt2449hq54af12p9gk.apps.googleusercontent.com",
  STORAGE_KEY: "smart_warehouse_waypoints_v2",
  MAP_TILE_PROVIDER: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};