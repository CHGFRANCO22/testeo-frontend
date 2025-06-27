// backend/Routes/informes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getTurnosPorProfesional,
    getEstadoTurnos,
    getEspecialidadesDemandadas,
    getHorariosDemanda
} = require('../controllers/informesController');

// Middleware para verificar si el usuario es Admin
const adminOnly = (req, res, next) => {
    // Se asume que authMiddleware ya se ejecutó y añadió req.user
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};

// --- Definición de Rutas Protegidas ---

// @route   GET /api/informes/turnos-por-profesional?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
// @desc    Informe de turnos atendidos por profesional en un rango de fechas.
// Se aplican los middlewares uno después del otro antes de llegar al controlador.
router.get('/turnos-por-profesional', authMiddleware, adminOnly, getTurnosPorProfesional);

// @route   GET /api/informes/estado-turnos
// @desc    Informe de turnos cancelados y reprogramados por especialidad.
router.get('/estado-turnos', authMiddleware, adminOnly, getEstadoTurnos);

// @route   GET /api/informes/especialidades-demandadas
// @desc    Informe de las especialidades con más turnos solicitados.
router.get('/especialidades-demandadas', authMiddleware, adminOnly, getEspecialidadesDemandadas);

// @route   GET /api/informes/horarios-demanda
// @desc    Informe de las horas del día con más turnos.
router.get('/horarios-demanda', authMiddleware, adminOnly, getHorariosDemanda);

module.exports = router;
