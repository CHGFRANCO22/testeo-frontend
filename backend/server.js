const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');
const contactoRoutes = require('./routes/contacto');
const pacientesRoutes = require('./routes/pacientes');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());



const publicPath = path.join(__dirname, '../Frontend');
app.use(express.static(publicPath));
app.use('/Escritorio', express.static(path.join(__dirname, 'Escritorio')));

const rootPath = path.join(__dirname, '..');

app.get('/', (req, res) => {
  res.sendFile(path.join(rootPath, 'index.html'));
});

app.use('/api/pacientes', pacientesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/contacto', contactoRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(rootPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
