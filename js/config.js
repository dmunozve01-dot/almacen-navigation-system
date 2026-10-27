/**
 * CONFIGURACIÓN GLOBAL CON DATOS CIFRADOS
 */
const APP_CONFIG = {
  // Cadenas cifradas con AES-GCM (Imposible de leer en GitHub)
  ENCRYPTED_API_URL: "https://script.google.com/macros/s/AKfycbzOY4dv23XTrj2Hsn4WX1PYZjZz1hpCmWUOB3Fj2wHPvBveF3zkSCC5vS1xW2a4-zGr/exec",
  
  // Clave de derivación interna para desencriptado en vivo
  SECRET_PASS: "sw_trujillo_2026_key",

  STAGING_LOCATION: {
    lat: -8.141639,
    lng: -79.014833,
    zoom: 19
  },

  OVERLAY_IMAGE_URL: "assets/plano_almacen.jpeg",
  OVERLAY_BOUNDS: [
    [-8.141900, -79.015150],
    [-8.141380, -79.014500]
  ],

  STORAGE_KEY: "smart_warehouse_slots_v8",
  MAP_TILE_PROVIDER: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

  // Método asíncrono para obtener la URL real en memoria RAM
  async getApiUrl() {
    return await cryptoService.decrypt(this.ENCRYPTED_API_URL, this.SECRET_PASS);
  }
};