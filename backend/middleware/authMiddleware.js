const jwt = require('jsonwebtoken');

// Middleware para verificar el token
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

        req.user = decoded;
        console.log('Token decodificado:', decoded);
        next();
    });
};

// Middleware para autorizar roles específicos
const authorizeRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ message: 'Acceso denegado: rol no autorizado' });
        }
        next();
    };
};

// Exportar ambas funciones
module.exports = { verifyToken, authorizeRoles };
