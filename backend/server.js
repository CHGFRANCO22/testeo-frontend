const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');
const contactoRoutes = require('./routes/contacto');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['*'], // Cambia esta URL al dominio/puerto de tu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const publicPath = path.join(__dirname, '../Frontend');
app.use(express.static(publicPath));

const rootPath = path.join(__dirname, '..');

app.get('/', (req, res) => {
  res.sendFile(path.join(rootPath, 'index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/contacto', contactoRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(rootPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
