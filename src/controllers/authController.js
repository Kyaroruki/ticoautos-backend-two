const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fetchPadronPerson } = require('../utils/padronService');

const lookupIdentity = async (req, res) => {
  try {
    const identifyNumber = req.params.identifyNumber || req.query.identify_number;

    if (identifyNumber === undefined || identifyNumber === null || String(identifyNumber).trim() === '') {
      return res.status(400).end();
    }

    const person = await fetchPadronPerson(identifyNumber);

    if (!person) {
      return res.status(404).end();
    }

    return res.json(person);
  } catch (error) {
    return res.status(502).end();
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
  
    const { username, password, identify_number, email, phone_number } = req.body;
    const profileImage = req.file ? req.file.filename : ''; // Si se subió una imagen, guarda su nombre, sino deja vacío
    const numericId = Number(identify_number); // Convertimos el identify_number a número para validarlo

    if (!username || !password || numericId <= 0 || !email || !phone_number) {
      return res.status(400).end();
    }

    const person = await fetchPadronPerson(numericId);// Validamos que la cédula exista en el padrón

    if (!person) { // Si no existe en el padron termina
      return res.status(404).end();
    }

    // Verificamos que no exista otro usuario con el mismo username, email o identify_number.
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(409).end();
    }

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(409).end();
    }

    const existingUserByIdentifyNumber = await User.findOne({ identify_number: numericId });
    if (existingUserByIdentifyNumber) {
      return res.status(409).end();
    }

    // Convertimos la contraseña en hash para no guardar la original.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creamos el usuario con los datos finales que se van a persistir.
    await User.createUser({
      username,
      password: hashedPassword,
      name: person.name,
      lastname: person.lastname,
      identify_number: numericId,
      email,
      phone_number,
      profileImage: profileImage || ''
    });

    return res.status(201).end();
  } catch (error) {
    return res.status(500).end();
  }
};

// Ruta: POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).end();
    }

    // Buscamos el usuario por username.
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).end();
    }

    // Comparamos la contraseña enviada con el hash guardado en la base.
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).end();
    }

    // Armamos un JWT con datos basicos del usuario.
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Devolvemos el token para que el frontend lo guarde y lo mande en Authorization.
    return res.json({ token });
  } catch (error) {
    res.status(500).end();
  }
};

module.exports = { lookupIdentity, register, login };