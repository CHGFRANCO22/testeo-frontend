const pool = require('../db');
const bcrypt = require('bcrypt');

exports.getAllPacientes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pa.id_paciente, per.nombre_completo, per.dni, pe.sexo, pe.edad, pa.email 
      FROM pacientes pa 
      JOIN persona pe ON pa.id_persona = pe.id
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener pacientes' });
  }
};

exports.createPaciente = async (req, res) => {
  const { nombre_completo, dni, sexo, edad, email, contrasena } = req.body;
  if (!nombre_completo || !dni || !sexo || !edad || !email || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }
  try {
    const [existing] = await pool.query('SELECT * FROM pacientes WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ mensaje: 'Email ya registrado' });
    }

    const [personaResult] = await pool.query(
      'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
      [nombre_completo, dni, sexo, edad]
    );
    const id_persona = personaResult.insertId;

    const hash = await bcrypt.hash(contrasena, 10);

    await pool.query(
      'INSERT INTO pacientes (id_persona, email, contrasena) VALUES (?, ?, ?)',
      [id_persona, email, hash]
    );

    res.status(201).json({ mensaje: 'Paciente creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear paciente' });
  }
};

exports.deletePaciente = async (req, res) => {
  const id = req.params.id;

  try {
    // 1. Eliminar los turnos relacionados
    await pool.query('DELETE FROM turnos WHERE id_paciente = ?', [id]);

    // 2. Luego eliminar el paciente
    const [result] = await pool.query('DELETE FROM pacientes WHERE id_paciente = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    }

    res.status(200).json({ mensaje: 'Paciente y turnos eliminados correctamente' });
  } catch (err) {
    console.error('Error al eliminar paciente:', err);
    res.status(500).json({ mensaje: 'Error al eliminar paciente' });
  }
};
