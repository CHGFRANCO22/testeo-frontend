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
    contrasena,           // Recibimos "contrasena" para que coincida con la base de datos
    nombre_titular,
    dni_titular,
    email_titular,
  } = req.body;

  // Validaciones básicas
  if (!nombre_completo || !dni || !sexo || !email || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios.' });
  }

  if (dni.length !== 8 || isNaN(dni)) {
    return res.status(400).json({ mensaje: 'El DNI debe tener 8 dígitos numéricos.' });
  }

  if (edad !== undefined && edad !== null && edad !== '') {
    const edadNum = Number(edad);
    if (isNaN(edadNum) || edadNum < 0 || edadNum > 120) {
      return res.status(400).json({ mensaje: 'Edad inválida.' });
    }
  }

  // Validación de contraseña
  const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!pwdRegex.test(contrasena)) {
    return res.status(400).json({
      mensaje: 'La contraseña debe tener al menos una mayúscula y un número.',
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 🚫 Antes: SELECT id_persona FROM persona
    const [existingPersona] = await connection.query(
      'SELECT id FROM persona WHERE dni = ?',
      [dni]
    );
    if (existingPersona.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        mensaje: 'El DNI del paciente ya está registrado.',
      });
    }

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

    if (nombre_titular && dni_titular && email_titular) {
      const [existingTitularDNI] = await connection.query(
        'SELECT id FROM persona WHERE dni = ?',
        [dni_titular]
      );
      if (existingTitularDNI.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          mensaje: 'El DNI del titular ya está registrado.',
        });
      }

      const [existingTitularEmail] = await connection.query(
        'SELECT id_paciente FROM pacientes WHERE email = ?',
        [email_titular]
      );
      if (existingTitularEmail.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          mensaje: 'El email del titular ya está registrado.',
        });
      }

      const [titularPersonaResult] = await connection.query(
        'INSERT INTO persona (nombre_completo, dni) VALUES (?, ?)',
        [nombre_titular, dni_titular]
      );
      const id_persona_titular = titularPersonaResult.insertId;

      const defaultTitularPassword = 'Titular123';
      const hashedTitularPass = await bcrypt.hash(defaultTitularPassword, 10);

      const [titularPacienteResult] = await connection.query(
        'INSERT INTO pacientes (id_persona, email, contrasena, id_titular) VALUES (?, ?, ?, NULL)',
        [id_persona_titular, email_titular, hashedTitularPass]
      );
      id_titular_paciente = titularPacienteResult.insertId;
    }

    const [personaResult] = await connection.query(
      'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
      [nombre_completo, dni, sexo, edad || null]
    );
    const id_persona = personaResult.insertId;

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    await connection.query(
      'INSERT INTO pacientes (id_persona, email, contrasena, id_titular) VALUES (?, ?, ?, ?)',
      [id_persona, email, hashedPassword, id_titular_paciente]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({ mensaje: 'Registro exitoso.' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error en register:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor.',
    });
  }
};

exports.login = async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios.' });
  }

  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id_paciente, contrasena FROM pacientes WHERE email = ?',
      [email]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: 'Email o contraseña incorrectos.' });
    }

    const valid = await bcrypt.compare(contrasena, rows[0].contrasena);
    if (!valid) {
      return res.status(401).json({ mensaje: 'Email o contraseña incorrectos.' });
    }

    // Ejemplo: generar token y devolver datos mínimos
    // const token = generateJWT({ id: rows[0].id_paciente });
    return res.status(200).json({
      mensaje: 'Login exitoso.',
      // token,
      usuario: { id: rows[0].id_paciente, email }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};
