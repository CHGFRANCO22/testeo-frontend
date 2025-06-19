// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Authorization header:', authHeader);

    if (!authHeader) return res.status(401).json({ message: 'Token requerido' });

    const cleanToken = authHeader.replace('Bearer ', '');
    console.log('Token limpio:', cleanToken);

    jwt.verify(cleanToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Error en jwt.verify:', err);
            return res.status(403).json({ message: 'Token inválido' });
        }

        req.user = decoded; // Puedes acceder a req.user.id luego
        console.log('Token decodificado:', decoded);
        next();
    });
};

module.exports = verifyToken;