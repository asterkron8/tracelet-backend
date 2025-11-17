const jwt = require('jsonwebtoken');
const JWT_SECRET = 'tu_clave_secreta_aqui'; // La misma clave secreta

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded.usuario;
        next(); // Deja pasar a la siguiente función (la ruta protegida)
    } catch (err) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};