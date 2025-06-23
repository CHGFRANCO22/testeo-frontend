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

// Obtener turnos filtrados por especialidad y/o profesional
router.get('/', async (req, res) => {
  const { especialidad, profesional } = req.query;

  try {
    let query = `
      SELECT 
        t.id, 
        t.fecha_turno, 
        t.estado, 
        per.nombre_completo AS paciente,
        esp.nombre AS especialidad,
        profe.nombre_completo AS profesional
      FROM turnos t
      JOIN pacientes pa ON t.id_paciente = pa.id_paciente
      JOIN persona per ON pa.id_persona = per.id
      JOIN especialidades esp ON t.id_especialidad = esp.id_espe
      JOIN profesionales p ON t.id_profesional = p.id_profesional
      JOIN persona profe ON p.id_persona = profe.id
      WHERE 1=1
    `;

    const params = [];

    if (especialidad) {
      query += ' AND t.id_especialidad = ?';
      params.push(especialidad);
    }

    if (profesional) {
      query += ' AND t.id_profesional = ?';
      params.push(profesional);
    }

    query += ' ORDER BY t.fecha_turno DESC';

    const [result] = await db.query(query, params);
    res.json(result);

  } catch (error) {
    console.error('❌ Error al filtrar turnos:', error);
    res.status(500).json({ mensaje: 'Error al filtrar turnos' });
  }
});


module.exports = router;
