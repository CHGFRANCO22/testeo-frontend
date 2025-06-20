// crearUsuariosConHash.js
const bcrypt = require('bcrypt');
const pool = require('./db');

async function crearUsuarios() {
  try {
    const contrasenaAdmin = await bcrypt.hash('Administrador1', 10);
    const contrasenaSecretaria = await bcrypt.hash('Secretaria1', 10);

    await pool.query(`
      INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES
      ('Administrador General', '10000001', 'M', 40),
      ('Secretaria Principal', '10000002', 'F', 35)
    `);

    await pool.query(`
      INSERT INTO usuarios (id_persona, email, contrasena, rol)
      VALUES
      (
        (SELECT id FROM persona WHERE nombre_completo = 'Administrador General'),
        'admin@saludtotal.com',
        ?,
        'admin'
      ),
      (
        (SELECT id FROM persona WHERE nombre_completo = 'Secretaria Principal'),
        'secretaria@saludtotal.com',
        ?,
        'secretaria'
      )
    `, [contrasenaAdmin, contrasenaSecretaria]);

    console.log('Usuarios insertados con contraseña encriptada');
    process.exit(0);
  } catch (err) {
    console.error('Error insertando usuarios:', err);
    process.exit(1);
  }
}

crearUsuarios();
