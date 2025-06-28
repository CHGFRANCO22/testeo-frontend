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

// --- RUTA PÚBLICA PARA PACIENTES ---
// Un paciente logueado puede ver SUS PROPIOS turnos.
router.get('/mios', authMiddleware, async (req, res) => {
    try {
        // Obtenemos el ID del paciente desde el token JWT que ya verificó authMiddleware
        const idPaciente = req.user.id; 
        
        const [turnos] = await pool.query(`
            SELECT t.id, t.fecha_turno, t.estado, 
                   prof_persona.nombre_completo AS profesional_nombre,
                   esp.nombre AS especialidad_nombre
            FROM turnos t
            LEFT JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            LEFT JOIN persona prof_persona ON prof.id_persona = prof_persona.id
            LEFT JOIN especialidades esp ON t.id_especialidad = esp.id_espe
            WHERE t.id_paciente = ?
            ORDER BY t.fecha_turno DESC
        `, [idPaciente]);
        res.json(turnos);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener mis turnos' });
    }
});


// --- RUTAS PRIVADAS PARA ADMIN/SECRETARIA ---

// RUTA DE DISPONIBILIDAD
router.get('/disponibilidad', authMiddleware, adminOrSecretaria, async (req, res) => {
    const { id_profesional, fecha } = req.query;
    if (!id_profesional || !fecha) return res.status(400).json({ msg: 'Faltan parámetros' });
    try {
        const [[agenda]] = await pool.query(`SELECT hora_inicio, hora_fin FROM agenda_medicos WHERE id_profesional = ? AND fecha = ?`, [id_profesional, fecha]);
        if (!agenda) return res.json([]);
        const slotsPosibles = [];
        let [horaInicio] = agenda.hora_inicio.split(':').map(Number);
        let [horaFin] = agenda.hora_fin.split(':').map(Number);
        for (let i = horaInicio; i < horaFin; i++) {
            slotsPosibles.push(`${String(i).padStart(2, '0')}:00`);
            slotsPosibles.push(`${String(i).padStart(2, '0')}:30`);
        }
        const [turnosOcupados] = await pool.query(`SELECT TIME_FORMAT(fecha_turno, '%H:%i') AS hora FROM turnos WHERE id_profesional = ? AND DATE(fecha_turno) = ? AND estado != 'cancelado'`, [id_profesional, fecha]);
        const horasOcupadas = new Set(turnosOcupados.map(t => t.hora));
        const disponibles = slotsPosibles.filter(slot => !horasOcupadas.has(slot));
        res.json(disponibles);
    } catch (error) { res.status(500).json({ msg: 'Error al calcular disponibilidad' }); }
});

// OBTENER TODOS LOS TURNOS (PARA LA TABLA DE GESTIÓN)
router.get('/', authMiddleware, adminOrSecretaria, async (req, res) => {
    try {
        const [turnos] = await pool.query(`
            SELECT t.id, t.fecha_turno, t.estado, t.id_paciente, t.id_profesional,
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
    } catch (error) { res.status(500).json({ msg: 'Error del servidor.' }); }
});

// OBTENER HISTORIAL DE UN PACIENTE ESPECÍFICO (VISTA ADMIN)
router.get('/paciente/:id', authMiddleware, adminOrSecretaria, async (req, res) => {
    try {
        const [turnos] = await pool.query(`SELECT ...`, [req.params.id]); // Tu consulta de historial aquí...
        res.json(turnos);
    } catch (error) { res.status(500).json({ msg: 'Error del servidor.' }); }
});

// CREAR, CANCELAR, REPROGRAMAR (RUTAS PRIVADAS)
router.post('/', authMiddleware, adminOrSecretaria, async (req, res) => { /* ... */ });
router.put('/cancelar/:id', authMiddleware, adminOrSecretaria, async (req, res) => { /* ... */ });
router.put('/reprogramar/:id', authMiddleware, adminOrSecretaria, async (req, res) => { /* ... */ });


module.exports = router;
