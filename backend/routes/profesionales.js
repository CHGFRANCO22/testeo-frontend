// routes/profesionales.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/turnos/profesionales/especialidad/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT prof.id_profesional, persona.nombre_completo
      FROM profesional_especialidad pe
      JOIN profesionales prof ON pe.id_profesional = prof.id_profesional
      JOIN persona ON prof.id_persona = persona.id
      WHERE pe.id_especialidad = ?
    `, [id]);

    res.json(rows);
  } catch (err) {
     console.error("❌ Error en /api/turnos/profesionales/especialidad/:id:\n", err.stack);
  res.status(500).json({ mensaje: 'Error al obtener profesionales' });
  }
});

module.exports = router;
