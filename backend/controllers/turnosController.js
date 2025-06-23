const db = require('../db');

// Crear turno con IDs
const crearTurno = async (req, res) => {
  try {
    const { id_profesional, id_especialidad, fecha_turno, id_paciente } = req.body;

    if (!id_profesional || !id_especialidad || !fecha_turno || !id_paciente) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    await db.query(
      `INSERT INTO turnos (id_paciente, id_profesional, id_especialidad, fecha_turno)
       VALUES (?, ?, ?, ?)`,
      [id_paciente, id_profesional, id_especialidad, fecha_turno]
    );

    res.status(201).json({ mensaje: 'Turno reservado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al reservar el turno' });
  }
};

// Obtener turnos por paciente autenticado
const obtenerTurnosPorPaciente = async (req, res) => {
  const idPaciente = req.user.id;

  try {
    const [turnos] = await db.query(
      `SELECT t.fecha_turno, p.nombre_completo AS profesional, e.nombre AS especialidad
       FROM turnos t
       JOIN profesionales prof ON t.id_profesional = prof.id_profesional
       JOIN persona p ON prof.id_persona = p.id
       JOIN especialidades e ON t.id_especialidad = e.id_espe
       WHERE t.id_paciente = ?
       ORDER BY t.fecha_turno DESC`,
      [idPaciente]
    );

    res.status(200).json(turnos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los turnos del paciente' });
  }
};

// Obtener historial turnos por ID de paciente (para admin o secretaria)
const obtenerTurnosPorIdPaciente = async (req, res) => {
  const idPaciente = req.params.id;

  try {
    const [turnos] = await db.query(
      `SELECT t.fecha_turno, p.nombre_completo AS profesional, e.nombre AS especialidad
       FROM turnos t
       JOIN profesionales prof ON t.id_profesional = prof.id_profesional
       JOIN persona p ON prof.id_persona = p.id
       JOIN especialidades e ON t.id_especialidad = e.id_espe
       WHERE t.id_paciente = ?
       ORDER BY t.fecha_turno DESC`,
      [idPaciente]
    );

    res.status(200).json(turnos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los turnos del paciente' });
  }
};

// Cancelar turno
const cancelarTurno = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "UPDATE turnos SET estado = 'cancelado' WHERE id_turno = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }
    res.json({ mensaje: "Turno cancelado correctamente" });
  } catch (err) {
    console.error("Error al cancelar turno:", err);
    res.status(500).json({ mensaje: "Error al cancelar el turno" });
  }
};

// Reprogramar turno
const reprogramarTurno = async (req, res) => {
  const { id } = req.params;
  const { fecha_turno } = req.body;

  if (!fecha_turno) {
    return res.status(400).json({ mensaje: "La nueva fecha es requerida" });
  }

  try {
    const [result] = await db.query(
      "UPDATE turnos SET fecha_turno = ?, estado = 'reprogramado', fecha_reprogramado = NOW() WHERE id_turno = ?",
      [fecha_turno, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }
    res.json({ mensaje: "Turno reprogramado correctamente" });
  } catch (err) {
    console.error("Error al reprogramar turno:", err);
    res.status(500).json({ mensaje: "Error al reprogramar el turno" });
  }
};

// Obtener todos los turnos
const obtenerTodosLosTurnos = async (req, res) => {
  try {
    const [turnos] = await db.query(`
      SELECT 
        t.id_turno,
        per.nombre_completo AS paciente_nombre,
        e.nombre AS especialidad,
        profe.nombre_completo AS profesional,
        t.fecha_turno
      FROM turnos t
      JOIN pacientes pa ON t.id_paciente = pa.id_paciente
      JOIN persona per ON pa.id_persona = per.id
      JOIN profesionales pr ON t.id_profesional = pr.id_profesional
      JOIN persona profe ON pr.id_persona = profe.id
      JOIN especialidades e ON t.id_especialidad = e.id_espe
      WHERE t.estado IS NULL OR t.estado NOT IN ('cancelado')
      ORDER BY t.fecha_turno DESC
    `);

    res.status(200).json(turnos);
  } catch (error) {
    console.error('Error al obtener todos los turnos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los turnos' });
  }
};

module.exports = {
  crearTurno,
  obtenerTurnosPorPaciente,
  obtenerTurnosPorIdPaciente,
  cancelarTurno,
  reprogramarTurno,
  obtenerTodosLosTurnos
};
