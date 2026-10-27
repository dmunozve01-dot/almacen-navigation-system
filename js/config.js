const APP_CONFIG = {
  // PEGA AQUÍ EL TEXTO LARGO ENCRIPTADO (Ver Fase 2 en instrucciones)
  ENCRYPTED_API_URL: "https://script.google.com/macros/s/AKfycbzOY4dv23XTrj2Hsn4WX1PYZjZz1hpCmWUOB3Fj2wHPvBveF3zkSCC5vS1xW2a4-zGr/exec",
  
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

  MAP_TILE_PROVIDER: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

  async getApiUrl() {
    if (!this.ENCRYPTED_API_URL || this.ENCRYPTED_API_URL.includes("AQUI_VA")) return null;
    try {
      return await cryptoService.decrypt(this.ENCRYPTED_API_URL, this.SECRET_PASS);
    } catch (e) {
      console.error("Error desencriptando URL.");
      return null;
    }
  }
};