const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener profesionales según especialidad
router.get('/api/turnos/profesionales/especialidad/:id', async (req, res) => {
  const { id } = req.params;
  console.log('📌 Buscando profesionales para especialidad ID:', id);

  try {
    const [rows] = await db.query(`
      SELECT prof.id_profesional, per.nombre_completo
      FROM profesional_especialidad pe
      JOIN profesionales prof ON pe.id_profesional = prof.id_profesional
      JOIN persona per ON prof.id_persona = per.id
      WHERE pe.id_especialidad = ?
    `, [id]);

    console.log('✅ Profesionales encontrados:', rows);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ 
       mensaje: 'Error al obtener profesionales',
       error: err.message,
       detalle: err.stack
  }
});

module.exports = router;
