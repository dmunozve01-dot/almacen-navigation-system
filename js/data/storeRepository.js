/**
 * REPOSITORIO DE DATOS PURO CON GOOGLE SHEETS
 * (Sin uso de localStorage)
 */
class StoreRepository {
  constructor() {
    // Datos de inicialización por defecto (Fallback en memoria)
    this.memoryData = [
      { code: "STAGING", name: "Staging Area Pallets", zone: "STAGING", lat: -8.141639, lng: -79.014833 },
      { code: "1730", name: "Slot Virú", zone: "ZONA VIRÚ", lat: -8.141450, lng: -79.015000 },
      { code: "1770", name: "Slot Chicama", zone: "ZONA CHICAMA", lat: -8.141450, lng: -79.014650 },
      { code: "1835", name: "Slot Chimbote A", zone: "ZONA CHIMBOTE A", lat: -8.141600, lng: -79.014950 },
      { code: "1840", name: "Slot Chimbote B", zone: "ZONA CHIMBOTE B", lat: -8.141600, lng: -79.014700 },
      { code: "1263", name: "Slot Trujillo", zone: "ZONA TRUJILLO", lat: -8.141750, lng: -79.014850 },
      { code: "PICK-01", name: "Mesa Picking", zone: "PICKING GENERAL", lat: -8.141850, lng: -79.014800 }
    ];
  }

  /**
   * Carga los slots directamente desde Google Sheets.
   */
  async loadFromCloud() {
    if (typeof apiService !== 'undefined') {
      const cloudSlots = await apiService.getSlots();
      if (cloudSlots && cloudSlots.length > 0) {
        this.memoryData = cloudSlots;
        return cloudSlots;
      }
    }
    return this.memoryData;
  }

  /**
   * Retorna los datos actualmente cargados en memoria.
   */
  getAll() {
    return this.memoryData;
  }

  /**
   * Guarda o actualiza un Slot directo en Google Sheets y actualiza la memoria.
   */
  saveOrUpdate(slot) {
    const idx = this.memoryData.findIndex(i => i.code === slot.code);
    if (idx !== -1) {
      this.memoryData[idx] = { ...this.memoryData[idx], ...slot };
    } else {
      this.memoryData.push(slot);
    }

    // Persistencia directa en Google Sheets
    if (typeof apiService !== 'undefined') {
      apiService.saveSlot(slot);
    }

    return this.memoryData;
  }

  /**
   * Elimina un Slot en Google Sheets y en la memoria local.
   */
  delete(index) {
    const deletedSlot = this.memoryData[index];
    this.memoryData.splice(index, 1);

    // Eliminación en Google Sheets
    if (deletedSlot && typeof apiService !== 'undefined') {
      apiService.deleteSlot(deletedSlot.code);
    }

    return this.memoryData;
  }
}