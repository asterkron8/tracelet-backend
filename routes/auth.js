const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = 'tu_clave_secreta_aqui';

// RUTA PARA REGISTRAR UN USUARIO
router.post('/register', async (req, res) => {
    // NOTA: Para simular, vamos a hacer que un email específico sea institucional
    const { nombre, email, password } = req.body;
    const isInstitutional = (email === 'policia@tracelet.com'); // Simulación de rol institucional

    try {
        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }
        usuario = new Usuario({ nombre, email, password, isInstitutional }); // <-- USAMOS EL NUEVO CAMPO
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);
        await usuario.save();
        res.json({ msg: 'Usuario registrado con éxito' });
    } catch (err) {
        res.status(500).send('Error de servidor');
    }
});

// RUTA PARA INICIAR SESIÓN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }
        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // --- CAMBIO CLAVE: AÑADIMOS EL ROL AL TOKEN ---
        const payload = {
            usuario: {
                id: usuario.id,
                isInstitutional: usuario.isInstitutional // <-- ENVIAMOS EL ROL
            }
        };
        // ---------------------------------------------

        jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        res.status(500).send('Error de servidor');
    }
});

module.exports = router;