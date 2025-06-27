// backend/Routes/turnos.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Necesario para el middleware de autenticación
const pool = require('../db');     // Traemos la conexión a la BD directamente

// =============================================================================
// == INICIO: CÓDIGO DE MIDDLEWARES INTEGRADO PARA ELIMINAR ERRORES ==
// Al poner el código aquí, evitamos los problemas con require()

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }
    try {
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};

const adminOrSecretaria = (req, res, next) => {
    if (req.user && (req.user.rol === 'admin' || req.user.rol === 'secretaria')) {
        return next();
    }
    return res.status(403).json({ msg: 'Acceso denegado.' });
};
// == FIN: CÓDIGO DE MIDDLEWARES INTEGRADO ==
// =============================================================================


// =============================================================================
// == INICIO: CÓDIGO DEL CONTROLADOR INTEGRADO ==
// Ponemos la lógica de las consultas aquí para evitar errores de importación

// OBTENER TODOS LOS TURNOS (PARA LA TABLA PRINCIPAL)
const getAllTurnos = async (req, res) => {
    try {
        const [turnos] = await pool.query(`
            SELECT 
                t.id, t.fecha_turno, t.estado, t.id_paciente,
                pac_persona.nombre_completo AS paciente_nombre,
                prof_persona.nombre_completo AS profesional_nombre,
                esp.nombre AS especialidad_nombre
            FROM turnos t
            LEFT JOIN pacientes pac ON t.id_paciente = pac.id_paciente
            LEFT JOIN persona pac_persona ON pac.id_persona = pac_persona.id
            LEFT JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            LEFT JOIN persona prof_persona ON prof.id_persona = prof_persona.id
            LEFT JOIN especialidades esp ON t.id_especialidad = esp.id_espe
            ORDER BY t.fecha_turno DESC
        `);
        res.json(turnos);
    } catch (error) {
        console.error("Error al obtener todos los turnos:", error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

// OBTENER HISTORIAL DE UN PACIENTE ESPECÍFICO
const getHistorialByPacienteId = async (req, res) => {
    const { idPaciente } = req.params;
    try {
        const [turnos] = await pool.query(`
            SELECT t.fecha_turno, prof_persona.nombre_completo AS profesional_nombre, esp.nombre AS especialidad_nombre
            FROM turnos t
            LEFT JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            LEFT JOIN persona prof_persona ON prof.id_persona = prof_persona.id
            LEFT JOIN especialidades esp ON t.id_especialidad = esp.id_espe
            WHERE t.id_paciente = ?
            ORDER BY t.fecha_turno DESC
        `, [idPaciente]);
        res.json(turnos);
    } catch (error) {
        console.error("Error al obtener historial del paciente:", error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

// CREAR UN NUEVO TURNO
const createTurno = async (req, res) => {
    const { id_paciente, id_profesional, id_especialidad, fecha_turno } = req.body;
    try {
        await pool.query(
            'INSERT INTO turnos (id_paciente, id_profesional, id_especialidad, fecha_turno, estado) VALUES (?, ?, ?, ?, ?)',
            [id_paciente, id_profesional, id_especialidad, fecha_turno, 'confirmado']
        );
        res.status(201).json({ msg: 'Turno creado exitosamente' });
    } catch (error) {
        console.error("Error al crear turno:", error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

// CANCELAR UN TURNO
const cancelarTurno = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE turnos SET estado = 'cancelado' WHERE id = ?", [id]);
        res.json({ msg: 'Turno cancelado correctamente.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

// REPROGRAMAR UN TURNO
const reprogramarTurno = async (req, res) => {
    const { id } = req.params;
    const { fecha_turno } = req.body;
    try {
        await pool.query("UPDATE turnos SET fecha_turno = ?, estado = 'reprogramado', fecha_reprogramado = NOW() WHERE id = ?", [fecha_turno, id]);
        res.json({ msg: 'Turno reprogramado correctamente.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};
// == FIN: CÓDIGO DEL CONTROLADOR INTEGRADO ==
// =============================================================================


// --- RUTAS (Ahora usan las funciones definidas en este mismo archivo) ---

router.get('/', authMiddleware, adminOrSecretaria, getAllTurnos);
router.get('/historial/:idPaciente', authMiddleware, adminOrSecretaria, getHistorialByPacienteId);
router.post('/', authMiddleware, adminOrSecretaria, createTurno);
router.put('/cancelar/:id', authMiddleware, adminOrSecretaria, cancelarTurno);
router.put('/reprogramar/:id', authMiddleware, adminOrSecretaria, reprogramarTurno);

module.exports = router;
