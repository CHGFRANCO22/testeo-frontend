const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');
const contactoRoutes = require('./routes/contacto');

const app = express(); // ← Esto tiene que ir antes

const PORT = process.env.PORT || 3000;

// Middleware CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Carpeta de archivos estáticos (Frontend)
const publicPath = path.join(__dirname, '../Frontend');
app.use(express.static(publicPath));

// Carpeta raíz donde está index.html (fuera de Frontend)
const rootPath = path.join(__dirname, '..');

// Ruta principal (index.html en la raíz del proyecto)
app.get('/', (req, res) => {
  res.sendFile(path.join(rootPath, 'index.html'));
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/contacto', contactoRoutes); // ← Ahora está bien ubicada

// Fallback para rutas no definidas (por ejemplo, para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(rootPath, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
