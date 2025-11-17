const express = require('express');
const router = express.Router();
const Dispositivo = require('../models/Dispositivo'); // Importa el modelo
const authMiddleware = require('../middleware/auth'); // Importa el guardián

// RUTA PÚBLICA (Verificar IMEI)
router.get('/verificar/:imei', async (req, res) => {
    try {
        const dispositivo = await Dispositivo.findOne({ imei: req.params.imei });
        if (!dispositivo) {
            return res.json({ 
                mensaje: "Este IMEI no está registrado en Tracelet.", 
                estado: "No registrado" 
            });
        }
        res.json({
            nombreDispositivo: dispositivo.nombreDispositivo,
            estado: dispositivo.estado,
            mensaje: "Dispositivo registrado y verificado."
        });
    } catch (error) {
        res.status(500).send("Error en el servidor");
    }
});

// RUTA PRIVADA (Registrar Dispositivo)
router.post('/registrar-dispositivo', authMiddleware, async (req, res) => {
    const { imei, nombreDispositivo, marca, modelo } = req.body;
    const idUsuario = req.usuario.id; // Viene del token (authMiddleware)

    try {
        let dispositivo = await Dispositivo.findOne({ imei: imei });
        if (dispositivo) {
            return res.status(400).json({ msg: "Este IMEI ya está registrado." });
        }
        dispositivo = new Dispositivo({
            imei,
            nombreDispositivo,
            marca,
            modelo,
            propietario: idUsuario // Asigna el propietario
        });
        await dispositivo.save();
        res.json({ msg: "Dispositivo registrado con éxito", dispositivo });
    } catch (error) {
        res.status(500).send("Error en el servidor");
    }
});

module.exports = router;