const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Se espera un formato 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, se requiere un token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    //console.log(user); // Verifica el contenido del token
    req.user = user; // El token contiene la información del usuario
    next(); // Pasa al siguiente middleware o ruta
  });
  
};

module.exports = authenticateToken;
