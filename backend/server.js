const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
