// backend/controllers/informesController.js
const { pool } = require('../db');

// Se define cada función de forma independiente.
const getTurnosPorProfesional = async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ msg: 'Debe proporcionar una fecha de inicio y una fecha de fin.' });
    }
    try {
        const [reporte] = await pool.query(`
            SELECT p.nombre_completo AS profesional, COUNT(t.id) AS cantidad_turnos
            FROM turnos t
            JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            JOIN persona p ON prof.id_persona = p.id
            WHERE t.estado = 'confirmado' AND DATE(t.fecha_turno) BETWEEN ? AND ?
            GROUP BY t.id_profesional, p.nombre_completo ORDER BY cantidad_turnos DESC;
        `, [fecha_inicio, fecha_fin]);
        res.json(reporte);
    } catch (error) {
        console.error('Error en reporte de turnos por profesional:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

const getEstadoTurnos = async (req, res) => {
    try {
        const [reporte] = await pool.query(`
            SELECT e.nombre AS especialidad,
                   SUM(CASE WHEN t.estado = 'cancelado' THEN 1 ELSE 0 END) AS turnos_cancelados,
                   SUM(CASE WHEN t.estado = 'reprogramado' THEN 1 ELSE 0 END) AS turnos_reprogramados
            FROM turnos t
            JOIN especialidades e ON t.id_especialidad = e.id_espe
            WHERE t.estado IN ('cancelado', 'reprogramado')
            GROUP BY e.nombre ORDER BY turnos_cancelados DESC, turnos_reprogramados DESC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error en reporte de estado de turnos:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

const getEspecialidadesDemandadas = async (req, res) => {
    try {
        const [reporte] = await pool.query(`
            SELECT e.nombre AS especialidad, COUNT(t.id) AS cantidad_solicitudes
            FROM turnos t JOIN especialidades e ON t.id_especialidad = e.id_espe
            GROUP BY e.nombre ORDER BY cantidad_solicitudes DESC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error en reporte de especialidades demandadas:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

const getHorariosDemanda = async (req, res) => {
    try {
        const [reporte] = await pool.query(`
            SELECT HOUR(fecha_turno) AS hora, COUNT(id) AS cantidad_turnos
            FROM turnos GROUP BY hora ORDER BY hora ASC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error en reporte de horarios de demanda:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

// Se exportan todas las funciones dentro de un único objeto.
// Esta es la forma más estándar y segura en CommonJS (el sistema de módulos de Node.js).
module.exports = {
    getTurnosPorProfesional,
    getEstadoTurnos,
    getEspecialidadesDemandadas,
    getHorariosDemanda
};
