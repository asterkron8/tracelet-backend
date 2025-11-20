const jwt = require('jsonwebtoken');
const JWT_SECRET = 'tu_clave_secreta_aqui';

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // --- CAMBIO CLAVE: GUARDAMOS TODO EL OBJETO USUARIO ---
        req.usuario = decoded.usuario; // req.usuario ahora contiene id y isInstitutional
        // ------------------------------------------------------

        next(); 
    } catch (err) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};