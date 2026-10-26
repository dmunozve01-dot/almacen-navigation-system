function searchStore(storeCode, mapInstance) {
    const pins = Storage.getPins();
    const cleanCode = storeCode.trim();
    const foundPin = pins.find(pin => pin.code.toLowerCase() === cleanCode.toLowerCase());
    const resultsContainer = document.getElementById('search-results');

    if (foundPin) {
        // Enfocar el mapa en las coordenadas exactas de la tienda encontrada
        mapInstance.setView([foundPin.y, foundPin.x], 1); 
        
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <p style="color: #2ecc71; font-weight: bold;">
                    ✅ Tienda encontrada: ${foundPin.code}
                </p>
            `;
        }
    } else {
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <p style="color: #e74c3c; font-weight: bold;">
                    ❌ No se encontró la tienda "${cleanCode}"
                </p>
            `;
        }
    }
}