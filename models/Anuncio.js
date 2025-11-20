const mongoose = require('mongoose');

const AnuncioSchema = new mongoose.Schema({
    // Referencia al dispositivo que se está vendiendo
    dispositivo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dispositivo', // Referencia al modelo Dispositivo
        required: true
    },
    // Referencia al vendedor (propietario)
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', // Referencia al modelo Usuario
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    // Estado del anuncio (Activo, Vendido)
    estadoAnuncio: {
        type: String,
        enum: ['Activo', 'Vendido'],
        default: 'Activo'
    }
});

module.exports = mongoose.model('Anuncio', AnuncioSchema);