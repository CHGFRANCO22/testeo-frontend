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
    edad,
    email,
    password,
    nombre_titular,
    dni_titular,
    email_titular,
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Validar si dni ya existe en persona (para paciente)
    const [existingPersona] = await connection.query(
      'SELECT id_persona FROM persona WHERE dni = ?',
      [dni]
    );
    if (existingPersona.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ mensaje: 'El DNI del paciente ya está registrado.' });
    }

    // Validar si email ya existe en pacientes
    const [existingEmail] = await connection.query(
      'SELECT id_paciente FROM pacientes WHERE email = ?',
      [email]
    );
    if (existingEmail.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ mensaje: 'El email ya está registrado.' });
    }

    let id_titular_paciente = null;

    // Si hay datos del titular, registrarlo primero (titular también es paciente)
    if (nombre_titular && dni_titular && email_titular) {
      // Validar si dni del titular existe
      const [existingTitularDNI] = await connection.query(
        'SELECT id_persona FROM persona WHERE dni = ?',
        [dni_titular]
      );
      if (existingTitularDNI.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ mensaje: 'El DNI del titular ya está registrado.' });
      }

      // Validar si email titular existe
      const [existingTitularEmail] = await connection.query(
        'SELECT id_paciente FROM pacientes WHERE email = ?',
        [email_titular]
      );
      if (existingTitularEmail.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ mensaje: 'El email del titular ya está registrado.' });
      }

      // Insertar persona titular (sin sexo ni edad porque no vienen del form)
      const [titularPersonaResult] = await connection.query(
        'INSERT INTO persona (nombre_completo, dni) VALUES (?, ?)',
        [nombre_titular, dni_titular]
      );
      const id_persona_titular = titularPersonaResult.insertId;

      // Crear password aleatorio para titular o usar contraseña genérica (puede ajustarse)
      const defaultTitularPassword = 'Titular123'; // Podés cambiar
      const hashedTitularPass = await bcrypt.hash(defaultTitularPassword, 10);

      // Insertar paciente titular (sin titular, porque es titular)
      const [titularPacienteResult] = await connection.query(
        'INSERT INTO pacientes (id_persona, email, password, id_titular) VALUES (?, ?, ?, NULL)',
        [id_persona_titular, email_titular, hashedTitularPass]
      );
      id_titular_paciente = titularPacienteResult.insertId;
    }

    // Insertar persona paciente
    const [personaResult] = await connection.query(
      'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
      [nombre_completo, dni, sexo, edad || null]
    );
    const id_persona = personaResult.insertId;

    // Encriptar password paciente
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar paciente con posible id_titular
    await connection.query(
      'INSERT INTO pacientes (id_persona, email, password, id_titular) VALUES (?, ?, ?, ?)',
      [id_persona, email, hashedPassword, id_titular_paciente]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({ mensaje: 'Registro exitoso' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};
