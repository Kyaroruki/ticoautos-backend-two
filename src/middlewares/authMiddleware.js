const jwt = require('jsonwebtoken');
const User = require('../models/User');


const authMiddleware = (req, res, next) => {
  // Leemos el header Authorization que normalmente viene como Bearer <token>.
  const authHeader = req.headers['authorization'];

  // Si no existe ese header, ni siquiera hay token para revisar.
  if (!authHeader) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporciono token' });
  }

  // Partimos el header por espacio y nos quedamos con la segunda parte, que es el token.
  const token = authHeader && authHeader.split(' ')[1];

  // Si la estructura del header vino mal y no saco token, tambien bloqueamos.
  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  // Verificamos firma y expiracion del token usando la clave secreta.
  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    // Si el token no pasa la validacion, respondemos 403.
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    // Si el token es valido, buscamos al usuario real en la base.
    const user = await User.findById(payload.userId);
    // Si el usuario ya no existe, la sesion se considera invalida.
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    //NUEVO: PARA VERIFICACION POR EMAIL
    if (user.status === 'pending') {
      return res.status(403).end();
    }
    // Guardamos el usuario en req.user para que el siguiente handler lo use facilito.
    req.user = user;
    // Seguimos al siguiente middleware o controlador.
    next();
  });
};

// para graphql, necesitamos una funcion que haga lo mismo pero devuelva el user en vez de usar res.status, 
// porque graphql maneja los errores diferente.
const getUserFromToken = async (authHeader) => {
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || user.status === 'pending') return null;

    return user;
  } catch {
    return null;
  }
};

// Exportamos el middleware para reutilizarlo en las rutas protegidas.
module.exports = {
  authMiddleware,
  getUserFromToken
};