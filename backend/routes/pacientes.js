const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const verifyToken = require('../middlewares/verifyToken');
router.put('/:id', verifyToken, pacientesController.updatePaciente);
// Obtener todos los pacientes (admin y secretaria)
router.get('/', verifyToken, authorizeRoles('admin', 'secretaria'), pacientesController.getAllPacientes);

// Crear paciente
router.post('/', verifyToken, authorizeRoles('admin', 'secretaria'), pacientesController.createPaciente);

// Eliminar paciente (solo admin)
router.delete('/:id', verifyToken, authorizeRoles('admin'), pacientesController.deletePaciente);

module.exports = router;
