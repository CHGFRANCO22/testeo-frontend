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
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};

// Aplicar middleware de autenticación y de rol de admin a todas las rutas de informes
router.use(authMiddleware, adminOnly);

// @route   GET /api/informes/turnos-por-profesional?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
// @desc    Informe de turnos atendidos por profesional en un rango de fechas.
router.get('/turnos-por-profesional', getTurnosPorProfesional);

// @route   GET /api/informes/estado-turnos
// @desc    Informe de turnos cancelados y reprogramados por especialidad.
router.get('/estado-turnos', getEstadoTurnos);

// @route   GET /api/informes/especialidades-demandadas
// @desc    Informe de las especialidades con más turnos solicitados.
router.get('/especialidades-demandadas', getEspecialidadesDemandadas);

// @route   GET /api/informes/horarios-demanda
// @desc    Informe de las horas del día con más turnos.
router.get('/horarios-demanda', getHorariosDemanda);

module.exports = router;
