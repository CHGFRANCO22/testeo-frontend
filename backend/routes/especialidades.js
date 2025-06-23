const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {  // ruta raíz del router
  try {
    const [result] = await db.query('SELECT id_espe, nombre FROM especialidades');
    res.json(result);
  } catch (err) {
    console.error('Error al cargar especialidades:', err);
    res.status(500).json({ mensaje: 'Error al cargar especialidades' });
  }
});

module.exports = router;
