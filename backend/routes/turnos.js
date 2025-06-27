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

// Proteger todas las rutas de esta sección
router.use(authMiddleware, adminOrSecretaria);

// --- RUTAS PARA LA GESTIÓN DE TURNOS ---

// Ruta principal para obtener TODOS los turnos para la tabla
router.get('/', getAllTurnos);

// Ruta para obtener el HISTORIAL de un paciente específico
router.get('/historial/:idPaciente', getHistorialByPacienteId);

// Ruta para CREAR un nuevo turno
router.post('/', createTurno);

// Ruta para CANCELAR un turno
router.put('/cancelar/:id', cancelarTurno);

// Ruta para REPROGRAMAR un turno
router.put('/reprogramar/:id', reprogramarTurno);

module.exports = router;
