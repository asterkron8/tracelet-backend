const mongoose = require('mongoose');

const dispositivoSchema = new mongoose.Schema({
    imei: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    propietario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    nombreDispositivo: {
        type: String,
        required: true
    },
    marca: String,
    modelo: String,
    estado: {
        type: String,
        enum: ['Activo', 'Perdido', 'Robado', 'Baja Definitiva'],
        default: 'Activo'
    },
    historial: [{
        fecha: Date,
        propietarioAnterior: String,
        propietarioNuevo: String
    }]
});

module.exports = mongoose.model('Dispositivo', dispositivoSchema);