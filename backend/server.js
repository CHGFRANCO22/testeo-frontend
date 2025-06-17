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

// Carpeta de archivos estáticos (HTML, CSS, JS)
const publicPath = path.join(__dirname, '../Frontend');
app.use(express.static(publicPath));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);

// Ruta principal (por si ingresan directamente al dominio)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Rutas no definidas: devolver index.html (útil para SPA o fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
