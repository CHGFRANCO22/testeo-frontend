// backend/routes/profesionales.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener TODOS los profesionales (para el formulario de Agenda)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.id_profesional, per.nombre_completo 
            FROM profesionales p
            JOIN persona per ON p.id_persona = per.id
            ORDER BY per.nombre_completo
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener profesionales' });
    }
});

// Obtener profesionales por especialidad (para el formulario de Turnos)
router.get('/por-especialidad/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // CORRECCIÓN: La consulta ahora une correctamente a través de la tabla 'profesional_especialidad'
        const [rows] = await pool.query(`
            SELECT prof.id_profesional, persona.nombre_completo
            FROM profesional_especialidad pe
            JOIN profesionales prof ON pe.id_profesional = prof.id_profesional
            JOIN persona ON prof.id_persona = persona.id
            WHERE pe.id_especialidad = ?
        `, [id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({
            mensaje: 'Error al obtener profesionales por especialidad',
            error: err.message,
        });
    }
});

module.exports = router;
