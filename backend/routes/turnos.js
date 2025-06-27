// backend/Routes/turnos.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Asumiendo que este es el middleware que funciona
const {
    getAllTurnos,
    getHistorialByPacienteId,
    createTurno,
    cancelarTurno,
    reprogramarTurno
} = require('../controllers/turnosController');

// Middleware para permisos de Admin o Secretaria
const adminOrSecretaria = (req, res, next) => {
    if (req.user && (req.user.rol === 'admin' || req.user.rol === 'secretaria')) {
        return next();
    }
    return res.status(403).json({ msg: 'Acceso denegado.' });
};

// --- LA LÍNEA QUE CAUSABA EL ERROR HA SIDO ELIMINADA ---
// Ya no usamos router.use() para aplicar los middlewares de forma global aquí.

// --- DEFINICIÓN DE RUTAS CON MIDDLEWARES APLICADOS INDIVIDUALMENTE ---

// Ruta principal para obtener TODOS los turnos para la tabla
// Se aplican los middlewares uno por uno antes de llegar a la función final.
router.get('/', authMiddleware, adminOrSecretaria, getAllTurnos);

// Ruta para obtener el HISTORIAL de un paciente específico
router.get('/historial/:idPaciente', authMiddleware, adminOrSecretaria, getHistorialByPacienteId);

// Ruta para CREAR un nuevo turno
router.post('/', authMiddleware, adminOrSecretaria, createTurno);

// Ruta para CANCELAR un turno
router.put('/cancelar/:id', authMiddleware, adminOrSecretaria, cancelarTurno);

// Ruta para REPROGRAMAR un turno
router.put('/reprogramar/:id', authMiddleware, adminOrSecretaria, reprogramarTurno);

module.exports = router;
