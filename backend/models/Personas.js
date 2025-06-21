const db = require('../db');

const crearPersona = async (nombre_completo, dni) => {
  const [result] = await db.query(
    'INSERT INTO persona (nombre_completo, dni) VALUES (?, ?)',
    [nombre_completo, dni]
  );
  return result.insertId;
};

module.exports = { crearPersona };
