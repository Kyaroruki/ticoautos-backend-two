const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Este endpoint registra un usuario nuevo.
// Ruta real: POST /api/auth/register
const register = async (req, res) => {
  try {
    // Sacamos del body los campos esperados.
    const { username, password, name } = req.body;
    // Si vino archivo subido, guardamos solo el nombre; si no, dejamos string vacio.
    const profileImage = req.file ? req.file.filename : '';

    // Si faltan datos minimos, cortamos de una vez.
    if (!username || !password) {
      return res.status(400).end();
    }

    // Revisamos si el username ya existe para no duplicar usuarios.
    const existingUser = await User.findByUsername(username);
    // Si ya existe, respondemos 400 porque ese registro ya no procede.
    if (existingUser) {
      return res.status(400).end();
    }

    // Convertimos la contraseña en hash para no guardar la original.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creamos el usuario con los datos finales que se van a persistir.
    await User.createUser({
      username,
      password: hashedPassword,
      name: name || '',
      profileImage: profileImage || ''
    });

    // Si todo salio bien, devolvemos 201 Created sin body.
    res.status(201).end();
  } catch (error) {
    // Si algo explota, devolvemos error interno.
    res.status(500).end();
  }
};

// Este endpoint autentica a un usuario existente.
// Ruta real: POST /api/auth/login
const login = async (req, res) => {
  try {
    // Leemos las credenciales enviadas por el frontend.
    const { username, password } = req.body;

    // Si falta alguna, no tiene sentido seguir.
    if (!username || !password) {
      return res.status(400).end();
    }

    // Buscamos el usuario por username.
    const user = await User.findByUsername(username);
    // Si no existe, respondemos no autorizado.
    if (!user) {
      return res.status(401).end();
    }

    // Comparamos la contraseña enviada con el hash guardado en la base.
    const isPasswordValid = await bcrypt.compare(password, user.password);
    // Si no coincide, tambien devolvemos 401.
    if (!isPasswordValid) {
      return res.status(401).end();
    }

    // Armamos un JWT con datos basicos del usuario.
    const token = jwt.sign(
      // El payload viaja firmado dentro del token.
      { userId: user._id, username: user.username },
      // Esta clave secreta firma el token y luego permite validarlo.
      process.env.JWT_SECRET,
      // El token dura 24 horas antes de expirar.
      { expiresIn: '24h' }
    );

    // Devolvemos el token para que el frontend lo guarde y lo mande en Authorization.
    return res.json({ token });
  } catch (error) {
    // Cualquier error inesperado cae aqui.
    res.status(500).end();
  }
};

// Exportamos las dos funciones para usarlas en las rutas.
module.exports = { register, login };