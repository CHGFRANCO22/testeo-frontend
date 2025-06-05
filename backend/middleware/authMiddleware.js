// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) return res.status(401).json({ message: 'Token requerido' });

    const cleanToken = token.replace('Bearer ', '');

    jwt.verify(cleanToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token inválido' });

        req.user = decoded; // Puedes acceder a req.user.id luego
        next();
    });
};

module.exports = verifyToken;
