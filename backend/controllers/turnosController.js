// backend/controllers/turnosController.js
const pool = require('../db');

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

module.exports = {
    getAllTurnos,
    getHistorialByPacienteId,
    createTurno,
    cancelarTurno,
    reprogramarTurno
};
