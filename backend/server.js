const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Ruta raíz que sirve index.html desde /frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);

// Captura rutas no definidas (opcional: puede servir para evitar 404 si se refresca una página frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
