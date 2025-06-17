// controllers/authController.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

exports.register = async (req, res) => {
  const { nombre_completo, dni, sexo, edad, email, contrasena } = req.body;

  if (!nombre_completo || !dni || !sexo || !edad || !email || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios.' });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existeDNI] = await connection.query('SELECT id FROM persona WHERE dni = ?', [dni]);
    if (existeDNI.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ mensaje: 'DNI ya registrado.' });
    }

    const [existeEmail] = await connection.query('SELECT id_paciente FROM pacientes WHERE email = ?', [email]);
    if (existeEmail.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ mensaje: 'Email ya registrado.' });
    }

    const [persona] = await connection.query(
      'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
      [nombre_completo, dni, sexo, edad]
    );

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    await connection.query(
      'INSERT INTO pacientes (id_persona, email, contrasena) VALUES (?, ?, ?)',
      [persona.insertId, email, hashedPassword]
    );

    await connection.commit();
    connection.release();
    return res.status(201).json({ mensaje: 'Registro exitoso.' });

  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};
