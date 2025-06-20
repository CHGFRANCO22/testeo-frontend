const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// LOGIN para pacientes, profesionales, usuarios
exports.login = async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    console.log(`Intentando login con email: ${email}`);

    // Buscar en pacientes
    const [pacienteRows] = await pool.query(`
      SELECT p.id_paciente AS id, p.email, p.contrasena, 'paciente' AS rol
      FROM pacientes p
      WHERE p.email = ?
    `, [email]);

    if (pacienteRows.length > 0) {
      const paciente = pacienteRows[0];
      console.log("Usuario encontrado en 'pacientes':", paciente);
      const coincide = await bcrypt.compare(contrasena, paciente.contrasena);
      console.log("Resultado comparación contraseña pacientes:", coincide);
      if (!coincide) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

      const token = jwt.sign({ id: paciente.id, rol: paciente.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ message: 'Login exitoso', token, usuario: { id: paciente.id, email, rol: paciente.rol } });
    }

    // Buscar en profesionales
    const [profesionalRows] = await pool.query(`
      SELECT pr.id_profesional AS id, pr.email, pr.contrasena, pr.rol
      FROM profesionales pr
      WHERE pr.email = ?
    `, [email]);

    if (profesionalRows.length > 0) {
      const profesional = profesionalRows[0];
      console.log("Usuario encontrado en 'profesionales':", profesional);
      const coincide = await bcrypt.compare(contrasena, profesional.contrasena);
      console.log("Resultado comparación contraseña profesionales:", coincide);
      if (!coincide) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

      const token = jwt.sign({ id: profesional.id, rol: profesional.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ message: 'Login exitoso', token, usuario: { id: profesional.id, email, rol: profesional.rol } });
    }

    // Buscar en usuarios (admin y secretaria)
    const [usuarioRows] = await pool.query(`
      SELECT u.id AS id, u.email, u.contrasena, u.rol
      FROM usuarios u
      WHERE u.email = ?
    `, [email]);

    if (usuarioRows.length > 0) {
      const usuario = usuarioRows[0];
      console.log("Usuario encontrado en 'usuarios':", usuario);
      const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
      console.log("Resultado comparación contraseña usuarios:", coincide);
      if (!coincide) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

      const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ message: 'Login exitoso', token, usuario: { id: usuario.id, email, rol: usuario.rol } });
    }

    console.log('Usuario no encontrado en ninguna tabla');
    return res.status(401).json({ mensaje: 'Usuario no encontrado' });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
};

// REGISTER solo para pacientes (web)
exports.register = async (req, res) => {
  const { nombre_completo, dni, sexo, edad, email, contrasena } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM pacientes WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    const [personaResult] = await pool.query(
      'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
      [nombre_completo, dni, sexo, edad]
    );
    const id_persona = personaResult.insertId;

    const hash = await bcrypt.hash(contrasena, 10);

    await pool.query(
      'INSERT INTO pacientes (id_persona, email, contrasena) VALUES (?, ?, ?)',
      [id_persona, email, hash]
    );

    res.status(201).json({ message: 'Usuario registrado correctamente', email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el registro' });
  }
};
