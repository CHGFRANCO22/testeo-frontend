// backend/Routes/pacientes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');     // Necesario para el middleware
const bcrypt = require('bcryptjs');  // Necesario para crear pacientes
const pool = require('../db');         // Conexión a la BD

// =============================================================================
// == INICIO: CÓDIGO DEL MIDDLEWARE INTEGRADO PARA ELIMINAR EL ERROR ==
// En lugar de importarlo con require, ponemos el código aquí.
// Esto elimina el error "got a [object Object]".
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};
// == FIN: CÓDIGO DEL MIDDLEWARE INTEGRADO ==
// =============================================================================

// Middleware para verificar si el usuario es Admin o Secretaria
const adminOrSecretaria = (req, res, next) => {
    if (req.user && (req.user.rol === 'admin' || req.user.rol === 'secretaria')) {
        return next();
    }
    return res.status(403).json({ msg: 'Acceso denegado. Se requieren permisos de Administrador o Secretaria.' });
};

// Middleware para verificar si el usuario es SOLO Admin
const adminOnly = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        return next();
    }
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Administrador.' });
};


// --- RUTAS CON LÓGICA INTEGRADA (SIN LLAMADAS EXTERNAS PROBLEMÁTICAS) ---

// 1. OBTENER TODOS LOS PACIENTES (Admin/Secretaria)
router.get('/admin/todos', authMiddleware, adminOrSecretaria, async (req, res) => {
    try {
        const [pacientes] = await pool.query(`
            SELECT pa.id_paciente, p.nombre_completo, p.edad, p.dni, pa.email, p.sexo
            FROM pacientes pa JOIN persona p ON pa.id_persona = p.id
            ORDER BY p.nombre_completo ASC
        `);
        res.json(pacientes);
    } catch (error) {
        console.error('Error al obtener todos los pacientes:', error);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
});

// 2. CREAR UN NUEVO PACIENTE (Admin/Secretaria)
router.post('/', authMiddleware, adminOrSecretaria, async (req, res) => {
    const { nombre_completo, dni, sexo, edad, email, contrasena } = req.body;
    if (!nombre_completo || !dni || !email || !contrasena) {
        return res.status(400).json({ msg: 'Faltan campos requeridos.' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);
        const [personaResult] = await connection.query(
            'INSERT INTO persona (nombre_completo, dni, sexo, edad) VALUES (?, ?, ?, ?)',
            [nombre_completo, dni, sexo, edad]
        );
        const id_persona = personaResult.insertId;
        await connection.query(
            'INSERT INTO pacientes (id_persona, email, contrasena) VALUES (?, ?, ?)',
            [id_persona, email, hashedPassword]
        );
        await connection.commit();
        res.status(201).json({ msg: 'Paciente creado con éxito.' });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ msg: 'El DNI o el Email ya existen.' });
        res.status(500).json({ msg: 'Error en el servidor al crear el paciente.' });
    } finally {
        connection.release();
    }
});

// 3. ACTUALIZAR UN PACIENTE (SOLO Admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { nombre_completo, edad, dni, email, sexo } = req.body;
    try {
        const [paciente] = await pool.query('SELECT id_persona FROM pacientes WHERE id_paciente = ?', [id]);
        if (paciente.length === 0) return res.status(404).json({ msg: 'Paciente no encontrado.' });
        
        await pool.query(
            'UPDATE persona SET nombre_completo = ?, edad = ?, dni = ?, sexo = ? WHERE id = ?',
            [nombre_completo, edad, dni, sexo, paciente[0].id_persona]
        );
        await pool.query('UPDATE pacientes SET email = ? WHERE id_paciente = ?', [email, id]);
        res.json({ msg: 'Paciente actualizado correctamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ msg: 'El DNI o el Email ya pertenecen a otra persona.' });
        res.status(500).json({ msg: 'Error del servidor al actualizar.' });
    }
});

// 4. ELIMINAR UN PACIENTE (SOLO Admin)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [paciente] = await connection.query('SELECT id_persona FROM pacientes WHERE id_paciente = ?', [id]);
        if (paciente.length === 0) return res.status(404).json({ msg: 'Paciente no encontrado.' });

        await connection.query('DELETE FROM pacientes WHERE id_paciente = ?', [id]);
        await connection.query('DELETE FROM persona WHERE id = ?', [paciente[0].id_persona]);
        
        await connection.commit();
        res.json({ msg: 'Paciente eliminado correctamente.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ msg: 'Error del servidor al eliminar.' });
    } finally {
        connection.release();
    }
});

module.exports = router;
