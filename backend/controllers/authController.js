const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { buscarPorEmail } = require('../models/Paciente');

exports.register = async (req, res) => {
  const { nombre_completo, dni, sexo, edad, email, contrasena } = req.body;

  try {
    // Verificamos si el email ya existe
    const [existing] = await pool.query('SELECT * FROM pacientes WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Insertamos en persona (4 columnas, 4 valores)
    const [personaResult] = await pool.query(
      'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
      [nombre_completo, dni, sexo, edad]
    );

    const id_persona = personaResult.insertId;

    // Encriptamos la contraseña
    const hash = await bcrypt.hash(contrasena, 10);

    // Insertamos en pacientes
    await pool.query(
      'INSERT INTO pacientes (id_persona, email, contrasena) VALUES (?, ?, ?)',
      [id_persona, email, hash]
    );

    res.status(201).json({ message: 'Usuario registrado correctamente', email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el registro' });
  }
};

exports.login = async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const usuario = await buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: usuario.id_paciente }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id_paciente,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
};
