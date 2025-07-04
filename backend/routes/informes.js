// backend/Routes/informes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Se añade para manejar el token
const pool = require('../db'); 

// --- CÓDIGO DEL MIDDLEWARE INTEGRADO PARA SOLUCIONAR EL ERROR ---
// En lugar de importarlo, ponemos el código aquí directamente.
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No hay token o el formato es incorrecto. Se requiere "Bearer <token>".' });
    }

    try {
        const token = authHeader.split(' ')[1];
        // Asegúrate de tener la variable JWT_SECRET en tu archivo .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Añade los datos del usuario (id, rol, etc.) al objeto request
        next(); // El token es válido, continúa a la siguiente función (adminOnly o el controlador)
    } catch (error) {
        res.status(401).json({ msg: 'Token no es válido.' });
    }
};

// Middleware para verificar si el usuario es Admin
const adminOnly = (req, res, next) => {
    // Este middleware se ejecuta DESPUÉS de authMiddleware, por lo que req.user ya existe.
    if (req.user && req.user.rol === 'admin') {
        return next(); // Si es admin, continúa
    }
    // Si no es admin, deniega el acceso.
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de administrador.' });
};


// --- DEFINICIÓN DE RUTAS CON LA LÓGICA INTEGRADA ---

// 1. Informe de turnos atendidos por profesional
router.get('/turnos-por-profesional', authMiddleware, adminOnly, async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ msg: 'Debe proporcionar una fecha de inicio y una fecha de fin.' });
    }
    try {
        const [reporte] = await pool.query(`
            SELECT p.nombre_completo AS profesional, COUNT(t.id) AS cantidad_turnos
            FROM turnos t
            JOIN profesionales prof ON t.id_profesional = prof.id_profesional
            JOIN persona p ON prof.id_persona = p.id
            WHERE t.estado = 'confirmado' AND DATE(t.fecha_turno) BETWEEN ? AND ?
            GROUP BY t.id_profesional, p.nombre_completo ORDER BY cantidad_turnos DESC;
        `, [fecha_inicio, fecha_fin]);
        res.json(reporte);
    } catch (error) {
        console.error('Error en reporte de turnos por profesional:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
});

// 2. Informe de estado de turnos (cancelados/reprogramados)
router.get('/estado-turnos', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [reporte] = await pool.query(`
            SELECT e.nombre AS especialidad,
                   SUM(CASE WHEN t.estado = 'cancelado' THEN 1 ELSE 0 END) AS turnos_cancelados,
                   SUM(CASE WHEN t.estado = 'reprogramado' THEN 1 ELSE 0 END) AS turnos_reprogramados
            FROM turnos t
            JOIN especialidades e ON t.id_especialidad = e.id_espe
            WHERE t.estado IN ('cancelado', 'reprogramado')
            GROUP BY e.nombre ORDER BY turnos_cancelados DESC, turnos_reprogramados DESC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error en reporte de estado de turnos:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
});

// 3. Informe de especialidades más demandadas
router.get('/especialidades-demandadas', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [reporte] = await pool.query(`
            SELECT e.nombre AS especialidad, COUNT(t.id) AS cantidad_solicitudes
            FROM turnos t JOIN especialidades e ON t.id_especialidad = e.id_espe
            GROUP BY e.nombre ORDER BY cantidad_solicitudes DESC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error en reporte de especialidades demandadas:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
});

// 4. Informe de horarios de mayor demanda
router.get('/horarios-demanda', authMiddleware, adminOnly, async (req, res) => {
     try {
        const [reporte] = await pool.query(`
            SELECT HOUR(fecha_turno) AS hora, COUNT(id) AS cantidad_turnos
            FROM turnos GROUP BY hora ORDER BY hora ASC;
        `);
        res.json(reporte);
    } catch (error) {
        console.error('Error en reporte de horarios de demanda:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
});


module.exports = router;
