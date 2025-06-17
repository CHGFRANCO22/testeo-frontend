// models/Paciente.js
const pool = require('../db'); // asegurate de que esté bien importado

async function buscarPorEmail(email) {
  const [result] = await pool.query('SELECT * FROM pacientes WHERE email = ?', [email]);
  return result[0]; // solo uno
}

module.exports = {
  buscarPorEmail
};
