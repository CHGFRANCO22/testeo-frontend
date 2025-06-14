// controllers/authController.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

exports.register = async (req, res) => {
  const {
    nombre_completo,
    dni,
    sexo,
    edad,               // <-- agregado
    email,
    password,
    nombre_titular,
    dni_titular,
    email_titular,
  } = req.body;

  try {
    const connection = await pool.getConnection();

    // Validar si dni ya existe
    const [existingPersona] = await connection.query(
      'SELECT id_persona FROM persona WHERE dni = ?',
      [dni]
    );
    if (existingPersona.length > 0) {
      connection.release();
      return res.status(400).json({ mensaje: 'El DNI ya está registrado.' });
    }

    // Insertar persona con edad
    const [personaResult] = await connection.query(
      'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
      [nombre_completo, dni, sexo, edad]
    );

    const id_persona = personaResult.insertId;

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar paciente
    await connection.query(
      'INSERT INTO pacientes (id_persona, email, password) VALUES (?, ?, ?)',
      [id_persona, email, hashedPassword]
    );

    // Si se envió datos de titular (por ser menor), insertar titular
    if (nombre_titular && dni_titular && email_titular) {
      // Aquí tendrías que insertar el titular en persona y relacionarlo si usas otra tabla
      // O guardar esa info en la tabla que corresponda
      // Por ejemplo:
      const [titularResult] = await connection.query(
        'INSERT INTO persona (nombre_completo, dni) VALUES (?, ?)',
        [nombre_titular, dni_titular]
      );
      const id_titular = titularResult.insertId;

      // Supongamos que hay una tabla paciente_titular que relaciona paciente con titular
      await connection.query(
        'INSERT INTO paciente_titular (id_paciente, id_titular, email) VALUES (?, ?, ?)',
        [id_persona, id_titular, email_titular]
      );
    }

    connection.release();
    return res.status(201).json({ mensaje: 'Registro exitoso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};
