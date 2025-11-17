const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario'); // Importa el modelo

const JWT_SECRET = 'tu_clave_secreta_aqui'; // Cámbiala luego

// RUTA PARA REGISTRAR UN USUARIO
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }
        usuario = new Usuario({ nombre, email, password });
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
        const payload = { usuario: { id: usuario.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token }); // Devuelve el token
        });
    } catch (err) {
        res.status(500).send('Error de servidor');
    }
});

module.exports = router;