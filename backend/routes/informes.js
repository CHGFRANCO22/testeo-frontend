const express = require('express');
const router = express.Router();
const db = require('../db'); // Asegurate que este es tu módulo de conexión a MySQL
const authMiddleware = require('../middlewares/auth'); // Si tenés un middleware de autenticación

router.use(authMiddleware);

// Turnos por profesional en rango de fechas
router.get('/turnos-por-profesional', async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    const [rows] = await db.query(`
      SELECT p.nombre_completo AS profesional, COUNT(*) AS total_turnos
      FROM turnos t
      JOIN profesionales p ON t.id_profesional = p.id_profesional
      WHERE t.fecha_turno BETWEEN ? AND ?
      GROUP BY p.nombre_completo
    `, [desde, hasta]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener turnos por profesional' });
  }
});

// Turnos cancelados y reprogramados (reprogramados = hay PUT, cancelados = DELETE)
router.get('/turnos-cancelados-reprogramados', async (req, res) => {
  try {
    const [cancelados] = await db.query(`
      SELECT COUNT(*) AS total_cancelados
      FROM turnos
      WHERE estado = 'cancelado'
    `);

    const [reprogramados] = await db.query(`
      SELECT COUNT(*) AS total_reprogramados
      FROM turnos
      WHERE estado = 'reprogramado'
    `);

    res.json({ cancelados: cancelados[0].total_cancelados, reprogramados: reprogramados[0].total_reprogramados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener datos de cancelados y reprogramados' });
  }
});

// Turnos por especialidad
router.get('/turnos-por-especialidad', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.nombre AS especialidad, COUNT(*) AS total_turnos
      FROM turnos t
      JOIN especialidades e ON t.id_especialidad = e.id_espe
      GROUP BY e.nombre
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener turnos por especialidad' });
  }
});

// Top pacientes del mes
router.get('/top-pacientes', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pa.nombre_completo AS paciente, COUNT(*) AS total_turnos
      FROM turnos t
      JOIN pacientes pa ON t.id_paciente = pa.id_paciente
      WHERE MONTH(t.fecha_turno) = MONTH(CURDATE())
      GROUP BY pa.nombre_completo
      ORDER BY total_turnos DESC
      LIMIT 5
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener top pacientes' });
  }
});

module.exports = router;
