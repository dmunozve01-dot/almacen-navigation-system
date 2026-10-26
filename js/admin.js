let mapInstanceAdmin = null;

function enableAdminMode(map) {
    mapInstanceAdmin = map;
    mapInstanceAdmin.on('click', onMapClick);
    console.log("Modo Mapeo (Admin) activado.");
}

function disableAdminMode() {
    if (mapInstanceAdmin) {
        mapInstanceAdmin.off('click', onMapClick);
        console.log("Modo Mapeo (Admin) desactivado.");
    }
}

function onMapClick(e) {
    const y = e.latlng.lat; 
    const x = e.latlng.lng;
    
    const storeCode = prompt("Ingresa el código de la tienda para este casillero/ubicación:");
    
    if (storeCode && storeCode.trim() !== "") {
        const newPin = {
            id: Date.now().toString(),
            code: storeCode.trim(),
            y: y,
            x: x
        };
        
        Storage.savePin(newPin);
        
        if (typeof renderPin === "function") {
            renderPin(newPin);
        }
    }
}