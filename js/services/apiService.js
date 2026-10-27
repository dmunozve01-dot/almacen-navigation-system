/**
 * SERVICIO DE API CONECTADO A GOOGLE SHEETS
 */
class APIService {
  constructor() {
    this.apiUrl = APP_CONFIG.API_URL;
  }

  // Guardar datos del usuario que inicia sesión
  async syncUser(userData) {
    if (!this.apiUrl || this.apiUrl.includes("TU_SCRIPT_ID_AQUI")) return;

    try {
      await fetch(this.apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveUser", user: userData })
      });
    } catch (err) {
      console.warn("Error guardando usuario en Sheet:", err);
    }
  }

  // Obtener slots almacenados en la hoja de cálculo
  async getSlots() {
    if (!this.apiUrl || this.apiUrl.includes("TU_SCRIPT_ID_AQUI")) return null;

    try {
      const res = await fetch(`${this.apiUrl}?action=getSlots`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.warn("Error leyendo de Google Sheets, usando caché local:", err);
      return null;
    }
  }

  // Guardar slot mapeado
  async saveSlot(slotData) {
    if (!this.apiUrl || this.apiUrl.includes("TU_SCRIPT_ID_AQUI")) return;

    try {
      await fetch(this.apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveSlot", slot: slotData })
      });
    } catch (err) {
      console.warn("Error enviando slot a Google Sheets:", err);
    }
  }

  // Eliminar slot
  async deleteSlot(code) {
    if (!this.apiUrl || this.apiUrl.includes("https://script.google.com/macros/s/AKfycbzOY4dv23XTrj2Hsn4WX1PYZjZz1hpCmWUOB3Fj2wHPvBveF3zkSCC5vS1xW2a4-zGr/exec")) return;

    try {
      await fetch(this.apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteSlot", code: code })
      });
    } catch (err) {
      console.warn("Error borrando slot en Google Sheets:", err);
    }
  }
}

const apiService = new APIService();