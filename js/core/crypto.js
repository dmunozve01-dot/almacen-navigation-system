class CryptoService {
  constructor() {
    this.algo = { name: 'AES-GCM', length: 256 };
  }
  async getKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    return window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode("smart_warehouse_salt_2026"), iterations: 100000, hash: "SHA-256" },
      keyMaterial, this.algo, false, ["encrypt", "decrypt"]
    );
  }
  async encrypt(plainText, password) {
    const key = await this.getKey(password);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(plainText));
    const buffer = new Uint8Array(iv.length + encrypted.byteLength);
    buffer.set(iv, 0);
    buffer.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...buffer));
  }
  async decrypt(cipherTextBase64, password) {
    try {
      const key = await this.getKey(password);
      const binary = atob(cipherTextBase64);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
      const iv = buffer.slice(0, 12);
      const data = buffer.slice(12);
      const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
      return new TextDecoder().decode(decrypted);
    } catch (e) { return null; }
  }
}
const cryptoService = new CryptoService();