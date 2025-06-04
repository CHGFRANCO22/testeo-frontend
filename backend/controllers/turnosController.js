const pool = require('../db');

exports.crearTurno = async (req, res) => {
  const { id_paciente, id_profesional, id_especialidad, fecha_turno } = req.body;

  try {
    const conn = await pool.getConnection();

    await conn.query(
      `INSERT INTO turnos (id_paciente, id_profesional, id_especialidad, fecha_turno) 
       VALUES (?, ?, ?, ?)`,
      [id_paciente, id_profesional, id_especialidad, fecha_turno]
    );

    conn.release();
    res.status(201).json({ mensaje: 'Turno creado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear el turno.' });
  }
};
