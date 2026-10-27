/**
 * SERVICIO DE API CON SEGURIDAD DESENCRIPTADA EN MEMORIA
 */
class APIService {

  async getBaseUrl() {
    return await APP_CONFIG.getApiUrl();
  }

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
    } catch (err) {
      console.warn("Error enviando usuario a la base de datos:", err);
    }
  }

  async getSlots() {
    const url = await this.getBaseUrl();
    if (!url) return null;

    try {
      const res = await fetch(`${url}?action=getSlots`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.warn("Error leyendo datos de la nube:", err);
      return null;
    }
  }

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
    } catch (err) {
      console.warn("Error guardando slot en la nube:", err);
    }
  }

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
    } catch (err) {
      console.warn("Error eliminando slot en la nube:", err);
    }
  }
}

const apiService = new APIService();