const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const informesRoutes = require('./routes/informes');
const pacientesRoutes = require('./routes/pacientes');
const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');
const contactoRoutes = require('./routes/contacto');
const especialidadesRoutes = require('./routes/especialidades');
const profesionalesRoutes = require('./routes/profesionales');
const agendaRoutes = require('./routes/agenda');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '..', 'Frontend');
const escritorioPath = path.join(__dirname, '..', 'Escritorio');

const agendaRoutes = require('./routes/agenda');
app.use(express.static(frontendPath));
app.use('/Escritorio', express.static(escritorioPath));
app.use('/api/informes', informesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/profesionales', profesionalesRoutes);

// Manejo de rutas API no encontradas
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ mensaje: 'Ruta de API no encontrada' });
  }
  next();
});

// Para frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
