class APIService {
  async getBaseUrl() {
    return await APP_CONFIG.getApiUrl();
  }

  async getUserRole(email) {
    const url = await this.getBaseUrl();
    if (!url) return "USER";

    try {
      const res = await fetch(`${url}?action=getUserRole&email=${encodeURIComponent(email)}`);
      const json = await res.json();
      return json.success ? json.role : "USER";
    } catch (err) {
      console.warn("Error consultando rol:", err);
      return "USER";
    }
  }

  async syncUser(userData) {
    const url = await this.getBaseUrl();
    if (!url) return;
    try {
      await fetch(url, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveUser", user: userData })
      });
    } catch (err) { console.warn("Error enviando usuario:", err); }
  }

  async getSlots() {
    const url = await this.getBaseUrl();
    if (!url) return null;
    try {
      const res = await fetch(`${url}?action=getSlots`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.warn("Error leyendo slots:", err);
      return null;
    }
  }

  async saveSlot(slotData) {
    const url = await this.getBaseUrl();
    if (!url) return;
    try {
      await fetch(url, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveSlot", slot: slotData })
      });
    } catch (err) { console.warn("Error guardando slot:", err); }
  }

  async deleteSlot(code) {
    const url = await this.getBaseUrl();
    if (!url) return;
    try {
      await fetch(url, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteSlot", code: code })
      });
    } catch (err) { console.warn("Error eliminando slot:", err); }
  }
}
const apiService = new APIService();