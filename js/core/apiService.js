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
    } catch (err) { return "USER"; }
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
    } catch (err) { console.warn(err); }
  }

  async getSlots() {
    const url = await this.getBaseUrl();
    if (!url) return [];
    try {
      const res = await fetch(`${url}?action=getSlots`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch (err) { return []; }
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
    } catch (err) { console.warn(err); }
  }
}
const apiService = new APIService();