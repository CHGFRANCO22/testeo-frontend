const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, verificarRol } = require('../middleware/authmidleware');

// Informe: Turnos atendidos por profesional
router.get('/turnos-atendidos', verificarToken, verificarRol(['admin', 'secretaria']), async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    const [result] = await db.query(`
      SELECT p.nombre AS profesional, COUNT(t.id_turno) AS cantidad
      FROM turnos t
      JOIN profesionales p ON t.id_profesional = p.id_profesional
      WHERE t.estado = 'confirmado' AND t.fecha BETWEEN ? AND ?
      GROUP BY p.nombre
    `, [desde, hasta]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener el informe.' });
  }
});

// Informe: Turnos cancelados y reprogramados
router.get('/turnos-cancelados-reprogramados', verificarToken, verificarRol(['admin', 'secretaria']), async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    const [result] = await db.query(`
      SELECT t.estado, COUNT(*) AS cantidad
      FROM turnos t
      WHERE t.estado IN ('cancelado', 'reprogramado') AND t.fecha BETWEEN ? AND ?
      GROUP BY t.estado
    `, [desde, hasta]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener el informe.' });
  }
});

module.exports = router;
