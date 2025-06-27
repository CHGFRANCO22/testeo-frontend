// backend/Routes/pacientes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllPacientes,
    createPaciente,
    updatePaciente,
    deletePaciente
} = require('../controllers/pacientesController');

// Middleware para verificar si el usuario es Admin o Secretaria
const adminOrSecretaria = (req, res, next) => {
    // Verificamos si el usuario tiene uno de los dos roles permitidos
    if (req.user && (req.user.rol === 'admin' || req.user.rol === 'secretaria')) {
        return next(); // Si es admin o secretaria, puede continuar
    }
    return res.status(403).json({ msg: 'Acceso denegado. Se requieren permisos de Administrador o Secretaria.' });
};

// Middleware para verificar si el usuario es SOLO Admin (para acciones críticas)
const adminOnly = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        return next(); // Si es admin, puede continuar
    }
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Administrador.' });
};


// --- DEFINICIÓN DE RUTAS CON PERMISOS AJUSTADOS ---

// RUTA PARA VER TODOS LOS PACIENTES (Permitido para Admin y Secretaria)
router.get('/admin/todos', authMiddleware, adminOrSecretaria, getAllPacientes);

// RUTA PARA CREAR UN NUEVO PACIENTE (Permitido para Admin y Secretaria)
router.post('/', authMiddleware, adminOrSecretaria, createPaciente);

// RUTA PARA ACTUALIZAR UN PACIENTE (Permitido SOLO para Admin)
router.put('/:id', authMiddleware, adminOnly, updatePaciente);

// RUTA PARA ELIMINAR UN PACIENTE (Permitido SOLO para Admin)
router.delete('/:id', authMiddleware, adminOnly, deletePaciente);

module.exports = router;
