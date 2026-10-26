// 1. Configuración de Leaflet con sistema de coordenadas simple (para mapas tipo imagen)
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 3
});

// 2. Definición del tamaño de la imagen del mapa
const w = 2000, h = 1200; 
const bounds = [[0, 0], [h, w]];

// Carga la imagen 'mapa.jpeg' ubicada en la raíz
L.imageOverlay('mapa.jpeg', bounds).addTo(map);
map.fitBounds(bounds);

// Capa de marcadores
const markersLayer = L.layerGroup().addTo(map);

// 3. Dibujar un pin en el mapa
function renderPin(pinData) {
    const marker = L.marker([pinData.y, pinData.x], {
        title: `Tienda: ${pinData.code}`
    });
    
    marker.bindPopup(`<b>Tienda: ${pinData.code}</b>`);
    markersLayer.addLayer(marker);
}

// 4. Cargar todos los pines guardados en LocalStorage
function loadExistingPins() {
    markersLayer.clearLayers();
    const pins = Storage.getPins();
    pins.forEach(pin => renderPin(pin));
}

// 5. Toggle para activar o desactivar Modo Admin / Usuario
const modeToggle = document.getElementById('mode-toggle');
if (modeToggle) {
    modeToggle.addEventListener('change', function(e) {
        if (e.target.checked) {
            enableAdminMode(map);
            document.getElementById('mode-label').innerText = "Modo Admin (Mapeando)";
        } else {
            disableAdminMode();
            document.getElementById('mode-label').innerText = "Modo Usuario (Navegación)";
        }
    });
}

// 6. Eventos del Buscador de Tiendas
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        const code = searchInput.value;
        if (code !== "") {
            searchStore(code, map);
        }
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const code = searchInput.value;
            if (code !== "") {
                searchStore(code, map);
            }
        }
    });
}

// Inicialización de la app
loadExistingPins();