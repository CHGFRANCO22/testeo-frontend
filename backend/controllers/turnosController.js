const db = require('../db');

// Crear turno
const crearTurno = async (req, res) => {
  try {
    const { nombre_profesional, nombre_especialidad, fecha_turno, id_paciente } = req.body;

    if (!nombre_profesional || !nombre_especialidad || !fecha_turno || !id_paciente) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    // Buscar ID de especialidad
    const [especialidad] = await db.query(
      'SELECT id_espe FROM especialidades WHERE nombre = ?',
      [nombre_especialidad]
    );
    if (especialidad.length === 0) {
      return res.status(404).json({ mensaje: 'Especialidad no encontrada' });
    }

    // Buscar ID del profesional
    const [profesional] = await db.query(
      `SELECT prof.id_profesional 
       FROM profesionales prof
       JOIN persona p ON prof.id_persona = p.id
       WHERE p.nombre_completo = ?`,
      [nombre_profesional]
    );
    if (profesional.length === 0) {
      return res.status(404).json({ mensaje: 'Profesional no encontrado' });
    }

    // Insertar turno
    await db.query(
      `INSERT INTO turnos (id_paciente, id_profesional, id_especialidad, fecha_turno)
       VALUES (?, ?, ?, ?)`,
      [id_paciente, profesional[0].id_profesional, especialidad[0].id_espe, fecha_turno]
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

module.exports = {
  crearTurno,
  obtenerTurnosPorPaciente,
  obtenerTurnosPorIdPaciente
};

