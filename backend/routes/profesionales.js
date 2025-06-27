// backend/routes/profesionales.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener profesionales según especialidad
router.get('/por-especialidad/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // CORRECCIÓN: La consulta ahora une correctamente a través de la tabla 'profesional_especialidad'
        const [rows] = await db.query(`
            SELECT prof.id_profesional, persona.nombre_completo
            FROM profesional_especialidad pe
            JOIN profesionales prof ON pe.id_profesional = prof.id_profesional
            JOIN persona ON prof.id_persona = persona.id
            WHERE pe.id_especialidad = ?
        `, [id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({
            mensaje: 'Error al obtener profesionales',
            error: err.message,
        });
    }
});

module.exports = router;
