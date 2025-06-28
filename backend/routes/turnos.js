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


// --- RUTAS PARA PACIENTES (No requieren rol de admin/secretaria) ---

// Ruta para que un paciente vea SUS PROPIOS turnos.
router.get('/mios', authMiddleware, async (req, res) => {
    try {
        const idPaciente = req.user.id;
        console.log(`[BACKEND] Buscando turnos para el paciente con ID: ${idPaciente}`);
        const [turnos] = await pool.query(`
            SELECT t.id, t.fecha_turno, t.estado,
                   prof_persona.nombre_completo AS profesional_nombre,
                   esp.nombre AS especialidad_nombre
            FROM turnos AS t
            LEFT JOIN profesionales AS prof ON t.id_profesional = prof.id_profesional
            LEFT JOIN persona AS prof_persona ON prof.id_persona = prof_persona.id
            LEFT JOIN especialidades AS esp ON t.id_especialidad = esp.id_espe
            WHERE t.id_paciente = ? ORDER BY t.fecha_turno DESC
        `, [idPaciente]);
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
    const { id: idUsuario, rol: rolUsuario } = req.user;
    try {
        let query = "UPDATE turnos SET estado = 'cancelado' WHERE id = ?";
        const params = [idTurno];
        if (rolUsuario === 'paciente') {
            query += " AND id_paciente = ?";
            params.push(idUsuario);
        }
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Turno no encontrado o no tienes permiso para cancelarlo.' });
        }
        res.json({ msg: 'Turno cancelado correctamente.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al cancelar el turno.' });
    }
});


// --- RUTAS EXCLUSIVAS PARA ADMIN/SECRETARIA ---

// **CORRECCIÓN**: La ruta de disponibilidad se mueve aquí para ser protegida correctamente.
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
    } catch (error) {
        console.error("Error al calcular disponibilidad:", error);
        res.status(500).json({ msg: 'Error al calcular disponibilidad' });
    }
});


// Ruta para obtener TODOS los turnos para la tabla de gestión
router.get('/', authMiddleware, adminOrSecretaria, async (req, res) => {
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
router.get('/paciente/:id', authMiddleware, adminOrSecretaria, async (req, res) => {
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
router.put('/reprogramar/:id', authMiddleware, adminOrSecretaria, async (req, res) => {
    const { fecha_turno } = req.body;
    try {
        await pool.query("UPDATE turnos SET fecha_turno = ?, estado = 'reprogramado', fecha_reprogramado = NOW() WHERE id = ?", [fecha_turno, req.params.id]);
        res.json({ msg: 'Turno reprogramado' });
    } catch (error) { res.status(500).json({ msg: 'Error al reprogramar' }); }
});


module.exports = router;
