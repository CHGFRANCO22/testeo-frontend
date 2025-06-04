const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { nombre_completo, dni, sexo, email, password } = req.body;

  try {
    const conn = await pool.getConnection();

    // Insertar en persona
    const [personaResult] = await conn.query(
      'INSERT INTO persona (nombre_completo, dni, sexo) VALUES (?, ?, ?)',
      [nombre_completo, dni, sexo]
    );

    const id_persona = personaResult.insertId;

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar en pacientes
    await conn.query(
      'INSERT INTO pacientes (id_persona, email, password) VALUES (?, ?, ?)',
      [id_persona, email, hashedPassword]
    );

    conn.release();
    res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar usuario.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(
      'SELECT pacientes.*, persona.nombre_completo FROM pacientes JOIN persona ON pacientes.id_persona = persona.id WHERE email = ?',
      [email]
    );

    conn.release();

    if (rows.length === 0) return res.status(401).json({ mensaje: 'Email no registrado' });

    const usuario = rows[0];

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: usuario.id_paciente, email: usuario.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, usuario: { nombre: usuario.nombre_completo, email: usuario.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en login' });
  }
};
