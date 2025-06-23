const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');


router.get('/api/pacientes', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT pa.id_paciente, per.nombre_completo
      FROM pacientes pa
      JOIN persona per ON pa.id_persona = per.id
    `);
    res.json(result);
  } catch (err) {
    console.error('❌ Error al cargar pacientes:', err);
    res.status(500).json({ mensaje: 'Error al cargar pacientes' });
  }
});

// Listar todos los pacientes
router.get('/', verifyToken, authorizeRoles('admin', 'secretaria'), pacientesController.getAllPacientes);

// Crear nuevo paciente
router.post('/', verifyToken, authorizeRoles('admin', 'secretaria'), pacientesController.createPaciente);

// Eliminar paciente por ID
router.delete('/:id', verifyToken, authorizeRoles('admin'), pacientesController.deletePaciente);

module.exports = router;
