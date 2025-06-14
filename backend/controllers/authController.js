const pool = require('../db');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { nombre_completo, dni, sexo, email, password, titular } = req.body;

  try {
    const conn = await pool.getConnection();

    // Verificar si el email ya existe (en pacientes)
    const [emailCheck] = await conn.query('SELECT * FROM pacientes WHERE email = ?', [email]);
    if (emailCheck.length > 0) {
      conn.release();
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    // Si es menor y tiene titular, validar que titular email no exista
    if (titular && titular.email) {
      const [titularCheck] = await conn.query('SELECT * FROM pacientes WHERE email = ?', [titular.email]);
      if (titularCheck.length > 0) {
        conn.release();
        return res.status(400).json({ mensaje: 'El email del titular ya está registrado.' });
      }
    }

    // Insertar persona paciente
    const [personaResult] = await conn.query(
      'INSERT INTO persona (nombre_completo, dni, sexo) VALUES (?, ?, ?)',
      [nombre_completo, dni, sexo]
    );
    const id_persona = personaResult.insertId;

    // Si hay titular, insertarlo primero y obtener id_titular
    let id_titular = null;
    if (titular) {
      const [personaTitularResult] = await conn.query(
        'INSERT INTO persona (nombre_completo, dni, sexo) VALUES (?, ?, ?)',
        [titular.nombre, titular.dni || null, 'No especificado'] // Si no pasas sexo del titular, usar 'No especificado'
      );
      const id_persona_titular = personaTitularResult.insertId;

      // Hashear la contraseña del titular con un password default o generar uno aleatorio
      // En este ejemplo, asignamos password genérica "Titular123"
      const hashedTitularPass = await bcrypt.hash('Titular123', 10);

      await conn.query(
        'INSERT INTO pacientes (id_persona, email, password) VALUES (?, ?, ?)',
        [id_persona_titular, titular.email, hashedTitularPass]
      );

      id_titular = id_persona_titular;
    }

    // Hashear contraseña paciente
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar paciente con id_titular (puede ser null)
    await conn.query(
      'INSERT INTO pacientes (id_persona, email, password, id_titular) VALUES (?, ?, ?, ?)',
      [id_persona, email, hashedPassword, id_titular]
    );

    conn.release();
    res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar usuario.' });
  }
};
