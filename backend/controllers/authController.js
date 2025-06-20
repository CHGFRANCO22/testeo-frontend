const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

exports.login = async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    // Intentar encontrar usuario en 'pacientes'
    const [pacienteRows] = await pool.query(`
      SELECT p.id_paciente AS id, p.email, p.contrasena, 'paciente' AS rol
      FROM pacientes p
      WHERE p.email = ?
    `, [email]);

    if (pacienteRows.length > 0) {
      const paciente = pacienteRows[0];
      const coincide = await bcrypt.compare(contrasena, paciente.contrasena);
      if (!coincide) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

      const token = jwt.sign({ id: paciente.id, rol: paciente.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ message: 'Login exitoso', token, usuario: { id: paciente.id, email, rol: paciente.rol } });
    }

    // Intentar encontrar usuario en 'profesionales'
    const [profesionalRows] = await pool.query(`
      SELECT pr.id_profesional AS id, pr.email, pr.contrasena, pr.rol
      FROM profesionales pr
      WHERE pr.email = ?
    `, [email]);

    if (profesionalRows.length > 0) {
      const profesional = profesionalRows[0];
      const coincide = await bcrypt.compare(contrasena, profesional.contrasena);
      if (!coincide) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

      const token = jwt.sign({ id: profesional.id, rol: profesional.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ message: 'Login exitoso', token, usuario: { id: profesional.id, email, rol: profesional.rol } });
    }

    // Intentar encontrar usuario en 'usuarios' (admin/secretaria)
    const [usuarioRows] = await pool.query(`
      SELECT u.id AS id, u.email, u.contrasena, u.rol
      FROM usuarios u
      WHERE u.email = ?
    `, [email]);

    if (usuarioRows.length > 0) {
      const usuario = usuarioRows[0];
      const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
      if (!coincide) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

      const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ message: 'Login exitoso', token, usuario: { id: usuario.id, email, rol: usuario.rol } });
    }

    // Si no se encontró en ninguna tabla
    return res.status(401).json({ mensaje: 'Usuario no encontrado' });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
};
