const express = require('express');
const router = express.Router();
const { crearTurno } = require('../controllers/turnosController');

router.post('/crear', crearTurno);

module.exports = router;
