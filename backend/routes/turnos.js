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

// --- Proteger todas las rutas de esta sección ---
router.use(authMiddleware, adminOrSecretaria);

// --- NUEVA RUTA DE DISPONIBILIDAD ---
router.get('/disponibilidad', async (req, res) => {
    const { id_profesional, fecha } = req.query;
    if (!id_profesional || !fecha) return res.status(400).json({ msg: 'Faltan parámetros' });
    
    try {
        const [[agenda]] = await pool.query(
            `SELECT hora_inicio, hora_fin FROM agenda_medicos WHERE id_profesional = ? AND fecha = ?`,
            [id_profesional, fecha]
        );
        
        if (!agenda) {
            return res.json([]); // Si no hay agenda, no hay horarios.
        }

        const slotsPosibles = [];
        let [horaInicio] = agenda.hora_inicio.split(':').map(Number);
        let [horaFin] = agenda.hora_fin.split(':').map(Number);
        
        for (let i = horaInicio; i < horaFin; i++) {
            slotsPosibles.push(`${String(i).padStart(2, '0')}:00`);
            slotsPosibles.push(`${String(i).padStart(2, '0')}:30`);
        }

        const [turnosOcupados] = await pool.query(
            `SELECT TIME_FORMAT(fecha_turno, '%H:%i') AS hora FROM turnos WHERE id_profesional = ? AND DATE(fecha_turno) = ? AND estado != 'cancelado'`,
            [id_profesional, fecha]
        );
        const horasOcupadas = new Set(turnosOcupados.map(t => t.hora));
        const disponibles = slotsPosibles.filter(slot => !horasOcupadas.has(slot));
        res.json(disponibles);
    } catch (error) {
        console.error("Error al calcular disponibilidad:", error);
        res.status(500).json({ msg: 'Error al calcular disponibilidad' });
    }
});


// --- LÓGICA DE TURNOS ---

const getAllTurnos = async (req, res) => {
    try {
        const [turnos] = await pool.query(`
            SELECT 
                t.id, t.fecha_turno, t.estado, t.id_paciente, t.id_profesional,
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
};

// **AQUÍ ESTÁ LA CORRECCIÓN**
// La función se llama ahora 'getHistorialByPacienteId' como antes
const getHistorialByPacienteId = async (req, res) => {
    // Pero la ruta ahora usa 'req.params.id' para coincidir con la URL
    try {
        const [turnos] = await pool.query(`
            SELECT t.fecha_turno, prof_persona.nombre_completo AS profesional_nombre, esp.nombre AS especialidad_nombre
            FROM turnos t
            LEFT JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            LEFT JOIN persona prof_persona ON prof.id_persona = prof_persona.id
            LEFT JOIN especialidades esp ON t.id_especialidad = esp.id_espe
            WHERE t.id_paciente = ? ORDER BY t.fecha_turno DESC
        `, [req.params.id]); // <-- Cambio clave: de idPaciente a id
        res.json(turnos);
    } catch (error) { res.status(500).json({ msg: 'Error del servidor.' }); }
};

const createTurno = async (req, res) => {
    const { id_paciente, id_profesional, id_especialidad, fecha_turno } = req.body;
    try {
        await pool.query('INSERT INTO turnos (id_paciente, id_profesional, id_especialidad, fecha_turno, estado) VALUES (?, ?, ?, ?, ?)', [id_paciente, id_profesional, id_especialidad, fecha_turno, 'confirmado']);
        res.status(201).json({ msg: 'Turno creado' });
    } catch (error) { res.status(500).json({ msg: 'Error al crear turno' }); }
};
const cancelarTurno = async (req, res) => {
    try {
        await pool.query("UPDATE turnos SET estado = 'cancelado' WHERE id = ?", [req.params.id]);
        res.json({ msg: 'Turno cancelado' });
    } catch (error) { res.status(500).json({ msg: 'Error al cancelar' }); }
};
const reprogramarTurno = async (req, res) => {
    const { fecha_turno } = req.body;
    try {
        await pool.query("UPDATE turnos SET fecha_turno = ?, estado = 'reprogramado', fecha_reprogramado = NOW() WHERE id = ?", [fecha_turno, req.params.id]);
        res.json({ msg: 'Turno reprogramado' });
    } catch (error) { res.status(500).json({ msg: 'Error al reprogramar' }); }
};


// --- RUTAS (Ahora usan las funciones definidas en este mismo archivo) ---
router.get('/', getAllTurnos);
// **AQUÍ ESTÁ LA CORRECCIÓN**
// La ruta ahora es '/paciente/:id' para coincidir con la llamada del frontend
router.get('/paciente/:id', getHistorialByPacienteId); 
router.post('/', createTurno);
router.put('/cancelar/:id', cancelarTurno);
router.put('/reprogramar/:id', reprogramarTurno);

module.exports = router;
