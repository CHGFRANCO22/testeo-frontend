const pool = require('../db');

async function buscarPorEmail(email) {
  const [rows] = await pool.query(
    `SELECT p.id_paciente, p.email, p.contrasena, per.nombre_completo 
     FROM pacientes p 
     JOIN persona per ON p.id_persona = per.id 
     WHERE p.email = ?`,
    [email]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

module.exports = { buscarPorEmail };
