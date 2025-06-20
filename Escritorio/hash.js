// hash.js
const bcrypt = require('bcrypt');

const contrasena = 'Administrador1'; // o 'Secretaria1'

bcrypt.hash(contrasena, 10, (err, hash) => {
  if (err) throw err;
  console.log('HASH:', hash);
});
