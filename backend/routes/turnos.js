const express = require('express');
const router = express.Router();

const { crearTurno, obtenerTurnosPorPaciente } = require('../controllers/turnosController');
const { verifyToken } = require('../middleware/authMiddleware');

// Crear nuevo turno (POST)
router.post('/crear', crearTurno);

// Obtener turnos de un paciente con token (GET)
router.get('/mis-turnos', verifyToken, obtenerTurnosPorPaciente);

console.log('Tipo de verifyToken:', typeof verifyToken);
console.log('Tipo de obtenerTurnosPorPaciente:', typeof obtenerTurnosPorPaciente);

module.exports = router;
