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

router.put('/cancelar/:id', verifyToken, authorizeRoles('admin', 'secretaria'), turnosController.cancelarTurno);
router.put('/reprogramar/:id', verifyToken, authorizeRoles('admin', 'secretaria'), turnosController.reprogramarTurno);

router.get('/especialidades', async (req, res) => {
  try {
    const [especialidades] = await db.query('SELECT id_espe, nombre FROM especialidades');
    res.json(especialidades);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener especialidades' });
  }
});

// Obtener profesionales por especialidad
router.get('/profesionales/especialidad/:id', async (req, res) => {
  const idEspecialidad = req.params.id;
  try {
    const [profesionales] = await db.query(`
      SELECT prof.id_profesional, p.nombre_completo
      FROM profesionales prof
      JOIN persona p ON prof.id_persona = p.id
      WHERE prof.id_especialidad = ?
    `, [idEspecialidad]);
    res.json(profesionales);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener profesionales' });
  }
});


// Esta ruta permite obtener pacientes SIN autenticación (solo nombre e ID para el select)
router.get('/publicos', async (req, res) => {
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
module.exports = router;
