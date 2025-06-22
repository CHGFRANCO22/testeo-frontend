const express = require('express');
const router = express.Router(); // 💥 Acá definís "router"
const db = require('../db'); // Ajustá si tu archivo de conexión tiene otro nombre

router.get('/especialidades', async (req, res) => {
  try {
    const [result] = await db.query(`SELECT id_espe, nombre FROM especialidades`);
    res.json(result);
  } catch (err) {
    console.error(err); // Para debug
    res.status(500).json({ mensaje: 'Error al cargar especialidades' });
  }
});

module.exports = router;
