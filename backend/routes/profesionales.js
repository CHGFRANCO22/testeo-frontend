const express = require('express');
const router = express.Router(); // ✅ Definición correcta
const db = require('../db'); // Ajustá si tu archivo de conexión se llama distinto

router.get('/api/turnos/profesionales/especialidad/:id', async (req, res) => {
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
    console.error("Error en /api/turnos/profesionales/especialidad/:id:", err);
    res.status(500).json({ mensaje: 'Error al obtener profesionales por especialidad' });
  }
});

module.exports = router;
