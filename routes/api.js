const express = require('express');
const router = express.Router();
const Dispositivo = require('../models/Dispositivo'); // Importa el modelo Dispositivo
const Anuncio = require('../models/Anuncio');       // Importa el modelo Anuncio
const authMiddleware = require('../middleware/auth'); // Importa el guardián

// =========================================================================
// 1. RUTAS PÚBLICAS (Verificación y Marketplace)
// =========================================================================

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

// RUTA PÚBLICA: VER TODOS LOS ANUNCIOS DEL MARKETPLACE
router.get('/marketplace', async (req, res) => {
    try {
        // Buscamos anuncios activos y traemos los datos del dispositivo y vendedor
        const anuncios = await Anuncio.find({ estadoAnuncio: 'Activo' })
            .populate('dispositivo', ['nombreDispositivo', 'marca', 'modelo', 'estado'])
            .populate('vendedor', ['nombre']);

        res.json(anuncios);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});

// =========================================================================
// 2. RUTAS PRIVADAS (Gestión del Usuario)
// =========================================================================

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
            propietario: idUsuario
        });
        await dispositivo.save();
        res.json({ msg: "Dispositivo registrado con éxito", dispositivo });
    } catch (error) {
        res.status(500).send("Error en el servidor");
    }
});

// RUTA PRIVADA: VER TODOS MIS DISPOSITIVOS
router.get('/mis-dispositivos', authMiddleware, async (req, res) => {
    try {
        // Busca todos los dispositivos cuyo propietario sea el ID del usuario logueado
        const dispositivos = await Dispositivo.find({ propietario: req.usuario.id });
        res.json(dispositivos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});

// RUTA PRIVADA: REPORTAR UN DISPOSITIVO (CAMBIAR ESTADO)
router.put('/dispositivo/reportar', authMiddleware, async (req, res) => {
    const { dispositivoId, nuevoEstado } = req.body;
    const idUsuario = req.usuario.id;

    // Validamos que el estado sea uno de los permitidos
    const estadosValidos = ['Activo', 'Perdido', 'Robado'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return res.status(400).json({ msg: 'Estado no válido' });
    }

    try {
        const dispositivo = await Dispositivo.findById(dispositivoId);

        if (!dispositivo) {
            return res.status(404).json({ msg: 'Dispositivo no encontrado' });
        }

        // El usuario solo puede modificar sus propios dispositivos
        if (dispositivo.propietario.toString() !== idUsuario) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        // Actualizamos el estado
        dispositivo.estado = nuevoEstado;
        await dispositivo.save();

        res.json({ msg: `Dispositivo actualizado a: ${nuevoEstado}`, dispositivo });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});

// =========================================================================
// 3. RUTAS PRIVADAS (Transacciones y Marketplace)
// =========================================================================

// RUTA PRIVADA: CREAR UN ANUNCIO EN EL MARKETPLACE
router.post('/marketplace/vender', authMiddleware, async (req, res) => {
    const { dispositivoId, precio, descripcion } = req.body;
    const idUsuario = req.usuario.id;

    try {
        // 1. Verificamos que el dispositivo existe y pertenece al usuario
        const dispositivo = await Dispositivo.findById(dispositivoId);
        
        if (!dispositivo) {
            return res.status(404).json({ msg: 'Dispositivo no encontrado' });
        }
        
        // Comprobamos que el ID del propietario del dispositivo es el mismo que el del token
        if (dispositivo.propietario.toString() !== idUsuario) {
            return res.status(401).json({ msg: 'No autorizado: No eres el propietario de este dispositivo' });
        }
        
        // 2. Comprobamos si ya existe un anuncio activo para este dispositivo
        const anuncioExistente = await Anuncio.findOne({ dispositivo: dispositivoId, estadoAnuncio: 'Activo' });
        if (anuncioExistente) {
            return res.status(400).json({ msg: 'Este dispositivo ya está a la venta' });
        }

        // 3. Creamos el nuevo anuncio
        const nuevoAnuncio = new Anuncio({
            dispositivo: dispositivoId,
            vendedor: idUsuario,
            precio,
            descripcion
        });

        await nuevoAnuncio.save();
        res.json(nuevoAnuncio);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});

// RUTA PRIVADA: "COMPRAR" UN DISPOSITIVO (TRANSFIERE PROPIEDAD)
router.post('/marketplace/comprar', authMiddleware, async (req, res) => {
    const { anuncioId } = req.body;
    const idComprador = req.usuario.id; // ID del usuario que está logueado (el comprador)

    try {
        // 1. Buscamos el anuncio
        const anuncio = await Anuncio.findById(anuncioId);
        if (!anuncio || anuncio.estadoAnuncio === 'Vendido') {
            return res.status(404).json({ msg: 'Este anuncio no está disponible.' });
        }

        // 2. Buscamos el dispositivo asociado
        const dispositivo = await Dispositivo.findById(anuncio.dispositivo);
        if (!dispositivo) {
            return res.status(404).json({ msg: 'Dispositivo no encontrado.' });
        }

        // 3. Verificamos que el comprador no sea el vendedor
        if (dispositivo.propietario.toString() === idComprador) {
            return res.status(400).json({ msg: 'No puedes comprar tu propio dispositivo.' });
        }

        const idVendedor = dispositivo.propietario;

        // --- INICIO DE LA TRANSFERENCIA ---
        // (Aquí iría la lógica de pago con Escrow)

        // 4. Actualizamos el Dispositivo
        dispositivo.propietario = idComprador; // ¡Cambiamos el propietario!
        dispositivo.historial.push({
            fecha: new Date(),
            propietarioAnterior: idVendedor.toString(), // Guardamos el ID del vendedor
            propietarioNuevo: idComprador
        });
        await dispositivo.save();

        // 5. Actualizamos el Anuncio
        anuncio.estadoAnuncio = 'Vendido';
        await anuncio.save();

        res.json({ msg: '¡Transferencia completada! El dispositivo ahora es tuyo.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});

// =========================================================================
// 4. RUTAS PRIVADAS (Panel Institucional)
// =========================================================================

// RUTA PRIVADA: PANEL INSTITUCIONAL (BÚSQUEDA AVANZADA)
router.get('/institucional/dispositivos-robados', authMiddleware, async (req, res) => {
    // 1. Verificación de Rol: Deniega si el flag 'isInstitutional' no está en el token.
    if (!req.usuario.isInstitutional) {
        return res.status(403).json({ msg: 'Acceso denegado. Solo para entidades institucionales.' });
    }

    try {
        // 2. Consulta avanzada: Busca todos los dispositivos robados o perdidos a nivel global.
        //
        const dispositivos = await Dispositivo.find({
            estado: { $in: ['Robado', 'Perdido'] }
        })
        .populate('propietario', ['nombre', 'email']); // Incluimos datos del propietario para la policía

        res.json({
            msg: `Mostrando ${dispositivos.length} dispositivos robados/perdidos registrados.`,
            dispositivos
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});


module.exports = router;