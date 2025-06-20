const bcrypt = require('bcrypt');

async function generarHash(password) {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log(`Hash para '${password}':\n${hash}`);
  } catch (error) {
    console.error('Error generando hash:', error);
  }
}

// Cambiá la contraseña aquí por la que querés generar
generarHash('Secretaria1');
