const db = require('../db');

// Crear turno con IDs
const crearTurno = async (req, res) => {
  try {
    const id_paciente = req.user.id;
    const { id_profesional, id_especialidad, fecha_turno } = req.body;


    if (!id_profesional || !id_especialidad || !fecha_turno || !id_paciente) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    // Verificar si ya hay 2 turnos en esa fecha y hora con ese profesional
    const [rows] = await db.query(
      `SELECT COUNT(*) AS cantidad FROM turnos 
       WHERE id_profesional = ? AND fecha_turno = ? AND (estado IS NULL OR estado = 'confirmado')`,
      [id_profesional, fecha_turno]
    );

    if (rows[0].cantidad >= 2) {
      return res.status(409).json({ mensaje: 'Ese horario ya está completo para este médico' });
    }

    // Si no hay 2, crear el turno
   const fechaFormateada = new Date(fecha_turno).toISOString().slice(0, 19).replace('T', ' ');
   await db.query(
  `INSERT INTO turnos (id_paciente, id_profesional, id_especialidad, fecha_turno)
   VALUES (?, ?, ?, ?)`,
  [id_paciente, id_profesional, id_especialidad, fechaFormateada]
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
      "UPDATE turnos SET estado = 'cancelado' WHERE id = ?",
      [id]
    );
    console.log("Resultado al cancelar:", result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }
    res.json({ mensaje: "Turno cancelado correctamente" });
  } catch (err) {
    console.error("Error al cancelar turno:", err);
    res.status(500).json({ mensaje: "Error al cancelar el turno" });
  }
};

document.querySelectorAll('button[data-accion="reprogramar"]').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const idTurno = e.target.dataset.id;
    
    // Abrir un prompt o diálogo para pedir nueva fecha y hora
    const nuevaFecha = prompt("Ingrese la nueva fecha (YYYY-MM-DD):");
    if (!nuevaFecha) return alert("Debe ingresar una fecha válida.");

    const nuevaHora = prompt("Ingrese la nueva hora (HH:mm):");
    if (!nuevaHora) return alert("Debe ingresar una hora válida.");

    const nuevaFechaHora = new Date(`${nuevaFecha}T${nuevaHora}`);
    if (isNaN(nuevaFechaHora.getTime())) {
      return alert("Fecha u hora inválida.");
    }

    // Enviar la solicitud PUT para reprogramar
    const resp = await fetch(`${API_URL}/turnos/${idTurno}/reprogramar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ fecha_turno: nuevaFechaHora.toISOString() })
    });

    if (resp.ok) {
      alert('Turno reprogramado correctamente');
      cargarTurnos();
    } else {
      const errorData = await resp.json();
      alert('Error al reprogramar: ' + (errorData.mensaje || 'Error desconocido'));
    }
  });
});
// Obtener horarios disponibles para un profesional en una fecha
const obtenerHorariosDisponibles = async (req, res) => {
  const { profesional, fecha } = req.query;

  if (!profesional || !fecha) {
    return res.status(400).json({ mensaje: 'Faltan parámetros' });
  }

  try {
    const fechaInicio = `${fecha} 00:00:00`;
    const fechaFin = `${fecha} 23:59:59`;

    // Obtener los horarios ya ocupados (solo turnos confirmados o sin estado)
    const [ocupados] = await db.query(
      `SELECT DATE_FORMAT(fecha_turno, '%H:%i') AS hora FROM turnos
       WHERE id_profesional = ? AND fecha_turno BETWEEN ? AND ?
       AND (estado IS NULL OR estado = 'confirmado')`,
      [profesional, fechaInicio, fechaFin]
    );

    const horariosOcupados = ocupados.map(row => row.hora);

    // Generar lista de horarios (de 8:00 a 16:30 cada 30 min)
    const horarios = [];
    for (let hora = 8; hora <= 16; hora++) {
      horarios.push(`${hora.toString().padStart(2, '0')}:00`);
      horarios.push(`${hora.toString().padStart(2, '0')}:30`);
    }

    // Filtrar los horarios disponibles (máx 2 turnos por horario)
    const disponibles = [];

    for (let hora of horarios) {
      const [conteo] = await db.query(
        `SELECT COUNT(*) AS cantidad FROM turnos 
         WHERE id_profesional = ? AND DATE_FORMAT(fecha_turno, '%Y-%m-%d %H:%i') = ? 
         AND (estado IS NULL OR estado = 'confirmado')`,
        [profesional, `${fecha} ${hora}`]
      );
      if (conteo[0].cantidad < 2) {
        disponibles.push(hora);
      }
    }

    res.json(disponibles);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener horarios' });
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
      "UPDATE turnos SET fecha_turno = ?, estado = 'reprogramado', fecha_reprogramado = NOW() WHERE id = ?",
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
        t.id AS id,
        per.nombre_completo AS paciente_nombre,
        e.nombre AS especialidad,
        profe.nombre_completo AS profesional,
        t.fecha_turno,
        COALESCE(t.estado, 'confirmado') AS estado  -- si estado es null lo mostramos como confirmado
      FROM turnos t
      JOIN pacientes pa ON t.id_paciente = pa.id_paciente
      JOIN persona per ON pa.id_persona = per.id
      JOIN profesionales pr ON t.id_profesional = pr.id_profesional
      JOIN persona profe ON pr.id_persona = profe.id
      JOIN especialidades e ON t.id_especialidad = e.id_espe
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
  obtenerTodosLosTurnos,
  obtenerHorariosDisponibles 
};
