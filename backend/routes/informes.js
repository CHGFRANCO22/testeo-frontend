// backend/Routes/informes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

// Se importan las funciones específicas que necesitamos desde el controlador.
// Esta sintaxis de desestructuración es la forma correcta de "desempacar"
// el objeto que exportamos en el otro archivo.
const {
    getTurnosPorProfesional,
    getEstadoTurnos,
    getEspecialidadesDemandadas,
    getHorariosDemanda
} = require('../controllers/informesController');

// Middleware para verificar si el usuario es Admin
const adminOnly = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        return next();
    }
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de administrador.' });
};

// --- Definición de Rutas Protegidas ---

// Pasamos las funciones directamente como callbacks.
// Express ejecutará los middlewares en orden y finalmente la función del informe.
router.get('/turnos-por-profesional', authMiddleware, adminOnly, getTurnosPorProfesional);
router.get('/estado-turnos', authMiddleware, adminOnly, getEstadoTurnos);
router.get('/especialidades-demandadas', authMiddleware, adminOnly, getEspecialidadesDemandadas);
router.get('/horarios-demanda', authMiddleware, adminOnly, getHorariosDemanda);

module.exports = router;
