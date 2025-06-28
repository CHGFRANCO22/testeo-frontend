// backend/routes/agenda.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

// --- MIDDLEWARES (Integrados para evitar errores) ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ msg: 'No hay token' });
    try {
        req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

const adminOrSecretaria = (req, res, next) => {
    if (req.user && (req.user.rol === 'admin' || req.user.rol === 'secretaria')) return next();
    return res.status(403).json({ msg: 'Acceso denegado.' });
};

router.use(authMiddleware, adminOrSecretaria);

// --- RUTAS DE AGENDA ---

// OBTENER TODAS LAS AGENDAS
router.get('/', async (req, res) => {
    try {
        // CORRECCIÓN: Seleccionamos la fecha en formato YYYY-MM-DD para evitar errores
        const [agendas] = await pool.query(`
            SELECT a.id, prof.id_profesional, p.nombre_completo as profesional_nombre, 
                   DATE_FORMAT(a.fecha, '%Y-%m-%d') as fecha, 
                   TIME_FORMAT(a.hora_inicio, '%H:%i') as hora_inicio, 
                   TIME_FORMAT(a.hora_fin, '%H:%i') as hora_fin
            FROM agenda_medicos a
            JOIN profesionales prof ON a.id_profesional = prof.id_profesional
            JOIN persona p ON prof.id_persona = p.id
            ORDER BY a.fecha DESC, p.nombre_completo
        `);
        res.json(agendas);
    } catch (error) {
        console.error("Error al obtener las agendas:", error);
        res.status(500).json({ msg: 'Error al obtener las agendas' });
    }
});

// CREAR UN NUEVO HORARIO
router.post('/', async (req, res) => {
    const { id_profesional, fecha, hora_inicio, hora_fin } = req.body;
    if (!id_profesional || !fecha || !hora_inicio || !hora_fin) {
        return res.status(400).json({ msg: 'Todos los campos son requeridos' });
    }
    try {
        const [[existe]] = await pool.query('SELECT id FROM agenda_medicos WHERE id_profesional = ? AND fecha = ?', [id_profesional, fecha]);
        if (existe) {
            return res.status(409).json({ msg: 'Ya existe una agenda para este profesional en esta fecha.' });
        }
        await pool.query(
            'INSERT INTO agenda_medicos (id_profesional, fecha, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)',
            [id_profesional, fecha, hora_inicio, hora_fin]
        );
        res.status(201).json({ msg: 'Agenda creada con éxito' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear la agenda' });
    }
});

// ACTUALIZAR UN HORARIO EXISTENTE
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { id_profesional, fecha, hora_inicio, hora_fin } = req.body;
    try {
        await pool.query(
            'UPDATE agenda_medicos SET id_profesional = ?, fecha = ?, hora_inicio = ?, hora_fin = ? WHERE id = ?',
            [id_profesional, fecha, hora_inicio, hora_fin, id]
        );
        res.json({ msg: 'Agenda actualizada con éxito' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar la agenda' });
    }
});

// ELIMINAR UN HORARIO DE LA AGENDA
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM agenda_medicos WHERE id = ?', [id]);
        res.json({ msg: 'Agenda eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar la agenda' });
    }
});

module.exports = router;
