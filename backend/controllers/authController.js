exports.register = async (req, res) => {
  console.log('Datos recibidos:', req.body);

  const { nombre_completo, dni, sexo, email, password, titular } = req.body;

  // Validaciones básicas manuales para ver qué falla
  if (!nombre_completo || !dni || !sexo || !email || !password) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios.' });
  }

  if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
    return res.status(400).json({ mensaje: 'El DNI debe tener 8 dígitos numéricos.' });
  }

  try {
    const conn = await pool.getConnection();

    // Verificar email paciente
    const [emailCheck] = await conn.query('SELECT * FROM pacientes WHERE email = ?', [email]);
    if (emailCheck.length > 0) {
      conn.release();
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    if (titular) {
      if (!titular.nombre || !titular.email) {
        conn.release();
        return res.status(400).json({ mensaje: 'Datos incompletos del titular.' });
      }
      const [titularCheck] = await conn.query('SELECT * FROM pacientes WHERE email = ?', [titular.email]);
      if (titularCheck.length > 0) {
        conn.release();
        return res.status(400).json({ mensaje: 'El email del titular ya está registrado.' });
      }
    }

    // Insert persona paciente
    const [personaResult] = await conn.query(
      'INSERT INTO persona (nombre_completo, dni, sexo) VALUES (?, ?, ?)',
      [nombre_completo, dni, sexo]
    );
    const id_persona = personaResult.insertId;

    let id_titular = null;
    if (titular) {
      const [personaTitularResult] = await conn.query(
        'INSERT INTO persona (nombre_completo, dni, sexo) VALUES (?, ?, ?)',
        [titular.nombre, titular.dni || null, 'No especificado']
      );
      const id_persona_titular = personaTitularResult.insertId;

      const hashedTitularPass = await bcrypt.hash('Titular123', 10);

      await conn.query(
        'INSERT INTO pacientes (id_persona, email, password) VALUES (?, ?, ?)',
        [id_persona_titular, titular.email, hashedTitularPass]
      );

      id_titular = id_persona_titular;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.query(
      'INSERT INTO pacientes (id_persona, email, password, id_titular) VALUES (?, ?, ?, ?)',
      [id_persona, email, hashedPassword, id_titular]
    );

    conn.release();
    return res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error('ERROR en register:', error);

    // Enviar detalles del error (solo para desarrollo)
    return res.status(500).json({ 
      mensaje: 'Error al registrar usuario.',
      detalle: error.message || error
    });
  }
};
