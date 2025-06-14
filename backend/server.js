const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS - permite peticiones desde cualquier origen (puedes configurar orígenes específicos si quieres)
app.use(cors());

// Middleware para parsear JSON en peticiones
app.use(express.json());

// Servir archivos estáticos (tu frontend) - asegúrate que la carpeta 'frontend' contenga tu index.html
app.use(express.static(path.join(__dirname, 'frontend')));

// Ruta raíz para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
