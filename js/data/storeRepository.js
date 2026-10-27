/**
 * REPOSITORIO SIMPLIFICADO DE SLOTS
 */
class StoreRepository {
  constructor() {
    this.rawInitialData = [
      { code: "STAGING", name: "Staging Area Pallets", zone: "STAGING", lat: -8.141639, lng: -79.014833 },
      { code: "1730", name: "Slot Virú", zone: "ZONA VIRÚ", lat: -8.141450, lng: -79.015000 },
      { code: "1770", name: "Slot Chicama", zone: "ZONA CHICAMA", lat: -8.141450, lng: -79.014650 },
      { code: "1835", name: "Slot Chimbote A", zone: "ZONA CHIMBOTE A", lat: -8.141600, lng: -79.014950 },
      { code: "1840", name: "Slot Chimbote B", zone: "ZONA CHIMBOTE B", lat: -8.141600, lng: -79.014700 },
      { code: "1263", name: "Slot Trujillo", zone: "ZONA TRUJILLO", lat: -8.141750, lng: -79.014850 },
      { code: "PICK-01", name: "Mesa Picking", zone: "PICKING GENERAL", lat: -8.141850, lng: -79.014800 }
    ];
  }

  getAll() {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    return saved ? JSON.parse(saved) : (this.saveAll(this.rawInitialData), this.rawInitialData);
  }

  saveAll(list) {
    localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(list));
  }

  saveOrUpdate(slot) {
    const list = this.getAll();
    const idx = list.findIndex(i => i.code === slot.code);
    idx !== -1 ? list[idx] = { ...list[idx], ...slot } : list.push(slot);
    this.saveAll(list);
    return list;
  }

  delete(index) {
    const list = this.getAll();
    list.splice(index, 1);
    this.saveAll(list);
    return list;
  }
}