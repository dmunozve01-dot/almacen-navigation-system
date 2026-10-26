/**
 * REPOSITORIO DE DATOS Y MANEJO DE ANTIDUPLICADOS
 */
class StoreRepository {
  constructor() {
    this.rawInitialData = [
      { code: "1263", name: "BUENOS3 TRU", zone: "ZONA TRUJILLO", lat: -8.1130, lng: -79.0300 },
      { code: "1264", name: "PALMA8 TRU", zone: "ZONA TRUJILLO", lat: -8.1150, lng: -79.0280 },
      { code: "1835", name: "MIRAF22 CHB", zone: "ZONA CHIMBOTE A", lat: -9.0744, lng: -78.5936 },
      { code: "1770", name: "PROGRE3 TRU", zone: "ZONA CHICAMA", lat: -7.8420, lng: -79.1410 },
      { code: "1730", name: "VIRU20 TRU", zone: "ZONA VIRÚ", lat: -8.4167, lng: -78.8000 },
      { code: "1268", name: "MOCHE8 TRU", zone: "ZONA TRUJILLO", lat: -8.1691, lng: -79.0094 },
      { code: "1723", name: "RAMONG1 TRU", zone: "ZONA TRUJILLO", lat: -8.1116, lng: -79.0286 },
      { code: "1615", name: "PRADA O13 TRU", zone: "ZONA VIRÚ", lat: -8.4180, lng: -78.8020 }
    ];
  }

  getAll() {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Antiduplicados inicial por código único
    const cleanMap = new Map();
    this.rawInitialData.forEach(item => cleanMap.set(item.code, item));
    const cleanList = Array.from(cleanMap.values());
    this.saveAll(cleanList);
    return cleanList;
  }

  saveAll(list) {
    localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(list));
  }

  saveOrUpdate(waypoint) {
    const currentList = this.getAll();
    const existingIndex = currentList.findIndex(item => item.code === waypoint.code);

    if (existingIndex !== -1) {
      currentList[existingIndex] = { ...currentList[existingIndex], ...waypoint };
    } else {
      currentList.push(waypoint);
    }

    this.saveAll(currentList);
    return currentList;
  }

  delete(index) {
    const currentList = this.getAll();
    currentList.splice(index, 1);
    this.saveAll(currentList);
    return currentList;
  }
}