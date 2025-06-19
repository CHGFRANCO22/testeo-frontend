const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/enviar', async (req, res) => {
  const { nombre, email, telefono, asunto, mensaje } = req.body;

  if (!nombre || !email || !telefono || !asunto || !mensaje) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  try {
    await db.query(
      `INSERT INTO contacto (nombre, email, telefono, asunto, mensaje) VALUES (?, ?, ?, ?, ?)`,
      [nombre, email, telefono, asunto, mensaje]
    );
    res.status(201).json({ mensaje: 'Formulario enviado correctamente.' });
  } catch (error) {
    console.error('Error al guardar contacto:', error);
    res.status(500).json({ mensaje: 'Error al enviar el formulario.' });
  }
});

router.get('/listar', async (req, res) => {
  const email = req.query.email;

  try {
    let result;

    if (email) {
      // Filtrar por email si se proporciona
      [result] = await db.query('SELECT * FROM contacto WHERE email = ? ORDER BY id DESC', [email]);
    } else {
      // Mostrar todos los mensajes (opcional)
      [result] = await db.query('SELECT * FROM contacto ORDER BY id DESC');
    }

    res.json(result);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ mensaje: 'Error al obtener los mensajes.' });
  }
});

module.exports = router;
