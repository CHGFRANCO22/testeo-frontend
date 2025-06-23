const express = require('express');
const router = express.Router();
const db = require('../db'); // Ajustá si tu archivo de conexión se llama distinto

// Ruta para obtener especialidades
router.get('/api/especialidades', async (req, res) => {
  try {
    const [result] = await db.query('SELECT id_espe, nombre FROM especialidades');
    res.json(result);
  } catch (err) {
    console.error('Error al cargar especialidades:', err);
    res.status(500).json({ mensaje: 'Error al cargar especialidades' });
  }
});

module.exports = router;
