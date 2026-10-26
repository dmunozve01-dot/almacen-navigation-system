const Storage = {
    savePin: function(pin) {
        let pins = this.getPins();
        pins.push(pin);
        localStorage.setItem('albo_pins', JSON.stringify(pins));
    },
    
    // Obtener todos los pines guardados
    getPins: function() {
        let pins = localStorage.getItem('albo_pins');
        return pins ? JSON.parse(pins) : [];
    },
    
    // Borrar un pin específico por su ID
    deletePin: function(id) {
        let pins = this.getPins();
        pins = pins.filter(pin => pin.id !== id);
        localStorage.setItem('albo_pins', JSON.stringify(pins));
    },

    // Limpiar todos los pines grabados
    clearPins: function() {
        localStorage.removeItem('albo_pins');
    }
};