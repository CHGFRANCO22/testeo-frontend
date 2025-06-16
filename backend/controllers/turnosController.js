const pool = require('../db');
const db = require('../db');

// ✅ Ahora crearTurno está definido como constante
const crearTurno = async (req, res) => {
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

const obtenerTurnosPorPaciente = (req, res) => {
  const pacienteId = req.user.id;

  const sql = `
    SELECT t.id, e.nombre AS especialidad, p.nombre_completo AS profesional, 
           t.fecha_turno, t.estado
    FROM turnos t
    JOIN especialidades e ON t.id_especialidad = e.id
    JOIN profesionales prof ON t.id_profesional = prof.id_profesional
    JOIN persona p ON prof.id_persona = p.id
    WHERE t.id_paciente = ?
    ORDER BY t.fecha_turno DESC
  `;

  db.query(sql, [pacienteId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener los turnos' });

    res.json(results);
  });
};

// ✅ Ahora sí se puede exportar correctamente
module.exports = {
  crearTurno,
  obtenerTurnosPorPaciente
};
