const bcrypt = require('bcrypt');
const pool = require('./db');  // tu conexión a la DB

const usuarios = [
  { email: 'admin@saludtotal.com', password: 'Administrador1' },
  { email: 'secretaria@saludtotal.com', password: 'Secretaria1' },
  // agregá más si querés...
];

async function actualizarHashes() {
  try {
    for (const user of usuarios) {
      const hash = await bcrypt.hash(user.password, 10);
      const [result] = await pool.query(
        'UPDATE usuarios SET contrasena = ? WHERE email = ?',
        [hash, user.email]
      );
      console.log(`Actualizado hash para ${user.email}: Filas afectadas = ${result.affectedRows}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error actualizando hashes:', error);
    process.exit(1);
  }
}

actualizarHashes();
