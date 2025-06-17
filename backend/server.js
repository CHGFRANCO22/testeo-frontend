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

// Servir archivos estáticos desde la carpeta "../frontend"
app.use(express.static(path.join(__dirname, '../frontend')));

// Ruta raíz que devuelve index.html (desde una carpeta arriba)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);

// Captura rutas no definidas del frontend (útil para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
