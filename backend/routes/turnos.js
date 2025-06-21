const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Crear turno (usuario autenticado)
router.post('/', verifyToken, turnosController.crearTurno);

// Obtener turnos del paciente autenticado
router.get('/mios', verifyToken, turnosController.obtenerTurnosPorPaciente);

// Obtener historial de turnos por ID (solo admin o secretaria si querés)
router.get('/paciente/:id', verifyToken, authorizeRoles('admin', 'secretaria'), turnosController.obtenerTurnosPorIdPaciente);

module.exports = router;
