const bcrypt = require('bcrypt');
const pool = require('./db');

async function crearUsuarioInicial(nombre, dni, sexo, edad, email, contrasenaPlano, rol) {
  try {
    // Verificar si ya existe el email
    const [existe] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existe.length > 0) {
      console.log(`❌ Ya existe el usuario con email: ${email}`);
      return;
    }

    // Insertar en persona
    const [personaResult] = await pool.query(
      'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
      [nombre, dni, sexo, edad]
    );
    const id_persona = personaResult.insertId;

    // Hashear contraseña
    const hash = await bcrypt.hash(contrasenaPlano, 10);

    // Insertar en usuarios
    await pool.query(
      'INSERT INTO usuarios (id_persona, email, contrasena, rol) VALUES (?, ?, ?, ?)',
      [id_persona, email, hash, rol]
    );

    console.log(`✅ Usuario creado: ${email} con rol ${rol}`);
  } catch (error) {
    console.error('⚠️ Error al crear usuario inicial:', error);
  }
}

async function main() {
  await crearUsuarioInicial('Administrador General', '12345678', 'M', 40, 'admin@saludtotal.com', 'Administrador1', 'admin');
  await crearUsuarioInicial('Secretaria Principal', '87654321', 'F', 35, 'secretaria@saludtotal.com', 'Secretaria1', 'secretaria');
  process.exit();
}

main();
