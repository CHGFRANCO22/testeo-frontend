// backend/controllers/informesController.js
const { pool } = require('../db');

/**
 * @desc    Informe: Cantidad de turnos atendidos por profesional en un período.
 * Consideramos 'confirmado' como atendido, ya que no hay otro estado.
 * @route   GET /api/informes/turnos-por-profesional
 * @access  Private (Admin)
 * @params  req.query.fecha_inicio, req.query.fecha_fin (YYYY-MM-DD)
 */
const getTurnosPorProfesional = async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ msg: 'Debe proporcionar una fecha de inicio y una fecha de fin.' });
    }

    try {
        const [reporte] = await pool.query(`
            SELECT 
                p.nombre_completo AS profesional,
                COUNT(t.id) AS cantidad_turnos
            FROM turnos t
            JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            JOIN persona p ON prof.id_persona = p.id
            WHERE t.estado = 'confirmado' AND DATE(t.fecha_turno) BETWEEN ? AND ?
            GROUP BY t.id_profesional, p.nombre_completo
            ORDER BY cantidad_turnos DESC;
        `, [fecha_inicio, fecha_fin]);
        
        res.json(reporte);

    } catch (error) {
        console.error('Error al generar reporte de turnos por profesional:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

/**
 * @desc    Informe: Turnos cancelados y reprogramados, agrupados por especialidad.
 * @route   GET /api/informes/estado-turnos
 * @access  Private (Admin)
 */
const getEstadoTurnos = async (req, res) => {
    try {
        const [reporte] = await pool.query(`
            SELECT 
                e.nombre AS especialidad,
                SUM(CASE WHEN t.estado = 'cancelado' THEN 1 ELSE 0 END) AS turnos_cancelados,
                SUM(CASE WHEN t.estado = 'reprogramado' THEN 1 ELSE 0 END) AS turnos_reprogramados
            FROM turnos t
            JOIN especialidades e ON t.id_especialidad = e.id_espe
            WHERE t.estado IN ('cancelado', 'reprogramado')
            GROUP BY e.nombre
            ORDER BY turnos_cancelados DESC, turnos_reprogramados DESC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error al generar reporte de estado de turnos:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

/**
 * @desc    Informe Adicional 1: Especialidades más solicitadas.
 * @route   GET /api/informes/especialidades-demandadas
 * @access  Private (Admin)
 */
const getEspecialidadesDemandadas = async (req, res) => {
    try {
        const [reporte] = await pool.query(`
            SELECT 
                e.nombre AS especialidad,
                COUNT(t.id) AS cantidad_solicitudes
            FROM turnos t
            JOIN especialidades e ON t.id_especialidad = e.id_espe
            GROUP BY e.nombre
            ORDER BY cantidad_solicitudes DESC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error al generar reporte de especialidades demandadas:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

/**
 * @desc    Informe Adicional 2: Horarios de mayor demanda de turnos.
 * @route   GET /api/informes/horarios-demanda
 * @access  Private (Admin)
 */
const getHorariosDemanda = async (req, res) => {
    try {
        const [reporte] = await pool.query(`
            SELECT 
                HOUR(fecha_turno) AS hora,
                COUNT(id) AS cantidad_turnos
            FROM turnos
            GROUP BY hora
            ORDER BY hora ASC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error al generar reporte de horarios de demanda:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};


module.exports = {
    getTurnosPorProfesional,
    getEstadoTurnos,
    getEspecialidadesDemandadas,
    getHorariosDemanda
};
