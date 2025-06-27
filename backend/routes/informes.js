// backend/Routes/informes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Importamos el objeto completo del controlador
const informesController = require('../controllers/informesController');

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
// Ahora accedemos a la función directamente desde el objeto del controlador importado.
router.get('/turnos-por-profesional', authMiddleware, adminOnly, informesController.getTurnosPorProfesional);

// @route   GET /api/informes/estado-turnos
// @desc    Informe de turnos cancelados y reprogramados por especialidad.
router.get('/estado-turnos', authMiddleware, adminOnly, informesController.getEstadoTurnos);

// @route   GET /api/informes/especialidades-demandadas
// @desc    Informe de las especialidades con más turnos solicitados.
router.get('/especialidades-demandadas', authMiddleware, adminOnly, informesController.getEspecialidadesDemandadas);

// @route   GET /api/informes/horarios-demanda
// @desc    Informe de las horas del día con más turnos.
router.get('/horarios-demanda', authMiddleware, adminOnly, informesController.getHorariosDemanda);

module.exports = router;
