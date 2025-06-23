const express = require('express');
const db = require('../db');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Listar todos los pacientes
router.get('/', verifyToken, authorizeRoles('admin', 'secretaria'), pacientesController.getAllPacientes);

// Crear nuevo paciente
router.post('/', verifyToken, authorizeRoles('admin', 'secretaria'), pacientesController.createPaciente);

// Eliminar paciente por ID
router.delete('/:id', verifyToken, authorizeRoles('admin'), pacientesController.deletePaciente);

module.exports = router;
