/**
 * SERVICIO DE API CONECTADO A GOOGLE SHEETS
 */
class APIService {

  async getBaseUrl() {
    if (typeof APP_CONFIG !== 'undefined' && typeof APP_CONFIG.getApiUrl === 'function') {
      return await APP_CONFIG.getApiUrl();
    }
    return null;
  }

  // Registra el inicio de sesión del usuario en la pestaña 'Usuarios' de Google Sheets
  async syncUser(userData) {
    const url = await this.getBaseUrl();
    if (!url) return;

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveUser", user: userData })
      });
      console.log("Usuario sincronizado con Google Sheets.");
    } catch (err) {
      console.warn("Error enviando usuario a Google Sheets:", err);
    }
  }

  // Lee todos los slots desde la pestaña 'Slots' de Google Sheets
  async getSlots() {
    const url = await this.getBaseUrl();
    if (!url) return null;

    try {
      const res = await fetch(`${url}?action=getSlots`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.warn("Error leyendo slots desde Google Sheets:", err);
      return null;
    }
  }

  // Guarda un nuevo slot en la pestaña 'Slots' de Google Sheets
  async saveSlot(slotData) {
    const url = await this.getBaseUrl();
    if (!url) return;

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveSlot", slot: slotData })
      });
      console.log("Slot guardado en Google Sheets.");
    } catch (err) {
      console.warn("Error guardando slot en Google Sheets:", err);
    }
  }

  // Elimina un slot en Google Sheets
  async deleteSlot(code) {
    const url = await this.getBaseUrl();
    if (!url) return;

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteSlot", code: code })
      });
      console.log("Slot eliminado en Google Sheets.");
    } catch (err) {
      console.warn("Error eliminando slot en Google Sheets:", err);
    }
  }
}

const apiService = new APIService();