const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pacientesRoutes = require('./routes/pacientes');
const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');
const contactoRoutes = require('./routes/contacto');
const especialidadesRoutes = require('./routes/especialidades');
const profesionalesRoutes = require('./routes/profesionales')
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '..', 'Frontend');
const escritorioPath = path.join(__dirname, '..', 'Escritorio');

app.use(express.static(frontendPath));
app.use('/Escritorio', express.static(escritorioPath));
app.use('/api/especialidades', especialidadesRoutes);  // en especialidades.js ruta: '/'
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api', profesionalesRoutes);  // acá cambió de /api/turnos a /api/profesionales
app.use('/api/pacientes', pacientesRoutes);          // acá agregás prefijo para pacientes
app.use(pacientesRoutes);
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
