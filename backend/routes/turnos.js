// backend/Routes/turnos.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

// --- MIDDLEWARES (Integrados para evitar errores) ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ msg: 'No hay token' });
    try {
        req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

const adminOrSecretaria = (req, res, next) => {
    if (req.user && (req.user.rol === 'admin' || req.user.rol === 'secretaria')) return next();
    return res.status(403).json({ msg: 'Acceso denegado.' });
};


// --- RUTAS PARA PACIENTES ---

// Ruta para que un paciente vea SUS PROPIOS turnos.
router.get('/mios', authMiddleware, async (req, res) => {
    try {
        const idPaciente = req.user.id;
        // Agregamos un log para ver qué ID de paciente estamos buscando
        console.log(`[BACKEND] Buscando turnos para el paciente con ID: ${idPaciente}`);

        // **AQUÍ ESTÁ LA CONSULTA SQL CORREGIDA Y REVISADA**
        const [turnos] = await pool.query(`
            SELECT 
                t.id, 
                t.fecha_turno, 
                t.estado,
                prof_persona.nombre_completo AS profesional_nombre,
                esp.nombre AS especialidad_nombre
            FROM turnos AS t
            LEFT JOIN profesionales AS prof ON t.id_profesional = prof.id_profesional
            LEFT JOIN persona AS prof_persona ON prof.id_persona = prof_persona.id
            LEFT JOIN especialidades AS esp ON t.id_especialidad = esp.id_espe
            WHERE t.id_paciente = ?
            ORDER BY t.fecha_turno DESC
        `, [idPaciente]);

        // Agregamos un log para ver qué datos estamos enviando al frontend
        console.log('[BACKEND] Datos de turnos encontrados:', turnos);
        
        res.json(turnos);

    } catch (error) {
        console.error('[BACKEND] Error en la ruta /mios:', error);
        res.status(500).json({ msg: 'Error al obtener mis turnos' });
    }
});

// Ruta para que cualquier usuario logueado cree un turno para sí mismo
router.post('/', authMiddleware, async (req, res) => {
    const { id_profesional, id_especialidad, fecha_turno } = req.body;
    const id_paciente = req.user.id; 
    try {
        await pool.query('INSERT INTO turnos (id_paciente, id_profesional, id_especialidad, fecha_turno, estado) VALUES (?, ?, ?, ?, ?)', [id_paciente, id_profesional, id_especialidad, fecha_turno, 'confirmado']);
        res.status(201).json({ msg: 'Turno creado con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear turno.' });
    }
});

// Ruta para que un usuario cancele su propio turno
router.put('/cancelar/:id', authMiddleware, async (req, res) => {
    const idTurno = req.params.id;
    const { id: idUsuario } = req.user;
    try {
        const [result] = await pool.query("UPDATE turnos SET estado = 'cancelado' WHERE id = ? AND id_paciente = ?", [idTurno, idUsuario]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Turno no encontrado o no tienes permiso para cancelarlo.' });
        }
        res.json({ msg: 'Turno cancelado correctamente.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al cancelar el turno.' });
    }
});


// --- RUTAS EXCLUSIVAS PARA ADMIN/SECRETARIA ---

// Proteger el resto de las rutas para que solo el personal pueda acceder
router.use(adminOrSecretaria);

// Ruta para obtener TODOS los turnos para la tabla de gestión
router.get('/', async (req, res) => {
    try {
        const [turnos] = await pool.query(`
            SELECT t.id, t.fecha_turno, t.estado, t.id_paciente, t.id_profesional,
                   pac_persona.nombre_completo AS paciente_nombre, prof_persona.nombre_completo AS profesional_nombre, esp.nombre AS especialidad_nombre
            FROM turnos t
            LEFT JOIN pacientes pac ON t.id_paciente = pac.id_paciente
            LEFT JOIN persona pac_persona ON pac.id_persona = pac_persona.id
            LEFT JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            LEFT JOIN persona prof_persona ON prof.id_persona = prof_persona.id
            LEFT JOIN especialidades esp ON t.id_especialidad = esp.id_espe
            ORDER BY t.fecha_turno DESC
        `);
        res.json(turnos);
    } catch (error) { res.status(500).json({ msg: 'Error del servidor.' }); }
});

// Ruta para ver el historial de CUALQUIER paciente (vista admin)
router.get('/paciente/:id', async (req, res) => {
    try {
        const [turnos] = await pool.query(`
            SELECT t.fecha_turno, prof_persona.nombre_completo AS profesional_nombre, esp.nombre AS especialidad_nombre
            FROM turnos t
            LEFT JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            LEFT JOIN persona prof_persona ON prof.id_persona = prof_persona.id
            LEFT JOIN especialidades esp ON t.id_especialidad = esp.id_espe
            WHERE t.id_paciente = ? ORDER BY t.fecha_turno DESC
        `, [req.params.id]);
        res.json(turnos);
    } catch (error) { res.status(500).json({ msg: 'Error del servidor.' }); }
});

// Ruta para reprogramar CUALQUIER turno (vista admin)
router.put('/reprogramar/:id', async (req, res) => {
    const { fecha_turno } = req.body;
    try {
        await pool.query("UPDATE turnos SET fecha_turno = ?, estado = 'reprogramado', fecha_reprogramado = NOW() WHERE id = ?", [fecha_turno, req.params.id]);
        res.json({ msg: 'Turno reprogramado' });
    } catch (error) { res.status(500).json({ msg: 'Error al reprogramar' }); }
});


module.exports = router;
