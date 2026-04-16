const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { fetchPadronPerson } = require('../utils/padronService');
const {buildVerificationUrl,createVerificationTokenData,sendVerificationEmail} = require('../utils/emailService');
const { sendVerificationCode } = require('../utils/smsService');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createPendingUserWithVerification = async (userData) => {
  const { verificationTokenEmail, expiresAt } = createVerificationTokenData();

  const user = await User.createUser({
    ...userData, //esto trae todos lo datos de usuario
    status: 'pending',
    verificationTokenEmail,
    verificationTokenExpiresAt: expiresAt
  });

  // Enviamos el email de verificación. 
  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl: buildVerificationUrl(verificationTokenEmail)
    });

    return user;
  } catch (error) {
    //Si falla el envío borramos el usuario creado para no tener cuentas pendientes sin poder activar.
    await User.findByIdAndDelete(user._id);
    throw error;
  }
};

//Para el padron
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
      if (existingUserByEmail.status === 'pending') {
        return res.status(409).end();
      }

      return res.status(409).end();
    }

    const existingUserByIdentifyNumber = await User.findOne({ identify_number: numericId });
    if (existingUserByIdentifyNumber) {
      return res.status(409).end();
    }

    // Convertimos la contraseña en hash 
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creamos el usuario con los datos finales 
    await createPendingUserWithVerification({
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

// POST /api/auth/google
// Recibe el token de Google, lo valida y devuelve JWT si el usuario ya existe,
// o indica que necesita cédula si es un usuario nuevo.
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).end();

    // Valida el token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Busca si el usuario ya existe por googleId o email
    const existingUser = await User.findOne({ $or: [{ googleId }, { email }] });

    if (existingUser) {
      //NUEVO: para verificacion por email
      if (existingUser.status === 'pending') {
        return res.status(403).end();
      }

      // Si ya existe, genera el JWT y permite el acceso
      const token = jwt.sign(
        { userId: existingUser._id, username: existingUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ token });
    }

    // Si es nuevo, pide la cédula al frontend
    return res.status(202).json({ needsCedula: true, googleId, email, googleName: name });
  } catch (error) {
    return res.status(500).end();
  }
};

// POST /api/auth/google/register
// Recibe credential de Google + cedula + username + phone_number, valida todo y crea el usuario.
const googleRegister = async (req, res) => {
  try {
    const { credential, identify_number, username, phone_number } = req.body;
    if (!credential || !identify_number || !username || !phone_number) {
      return res.status(400).end();
    }

    // Valida el token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email } = payload;

    // Verifica que no exista otro usuario con el mismo googleId o email
    const existingUser = await User.findOne({ $or: [{ googleId }, { email }] });
    if (existingUser) {
      if (existingUser.status === 'pending') {
        return res.status(409).end();
      }

      return res.status(409).end();
    }

    // Valida la cédula con el padrón
    const numericId = Number(identify_number);
    const person = await fetchPadronPerson(numericId);
    if (!person) return res.status(404).end();

    // Verifica que username e identify_number no estén en uso
    const existingByUsername = await User.findByUsername(username);
    if (existingByUsername) return res.status(409).end();

    const existingByIdentify = await User.findOne({ identify_number: numericId });
    if (existingByIdentify) return res.status(409).end();

    // Crea el usuario sin contraseña (solo Google)
    await createPendingUserWithVerification({
      username,
      password: '',
      googleId,
      email,
      name: person.name,
      lastname: person.lastname,
      identify_number: numericId,
      phone_number
    });

    return res.status(201).end();
  } catch (error) {
    return res.status(500).end();
  }
};

// Ruta: POST /api/auth/login
// PASO 1 del flujo 2FA: valida usuario/contraseña, envía código por SMS.
// No devuelve el token aún; el token se genera en /verify-2fa.
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

    // Si la cuenta aún no fue activada por email, no puede ingresar.
    if (user.status === 'pending') {
      return res.status(403).end();
    }

    // Comparamos la contraseña enviada con el hash guardado en la base.
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).end();
    }

    // Generamos código 2FA de 6 dígitos y lo guardamos con expiración de 5 minutos.
    const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFACode = twoFACode;
    user.twoFACodeExpiresAt = new Date(Date.now() + 7 * 60 * 1000);
    await user.save();

    // Enviamos el código por SMS al número registrado del usuario.
    await sendVerificationCode(user.phone_number, twoFACode);

    // Informamos al frontend que se requiere el código 2FA.
    return res.json({ twoFARequired: true });
  } catch (error) {
    res.status(500).end();
  }
};

// Ruta: POST /api/auth/verify-2fa
// PASO 2 del flujo 2FA: valida el código del SMS y devuelve el JWT.
const verify2FA = async (req, res) => {
  try {
    const { username, code } = req.body;

    if (!username || !code) {
      return res.status(400).end();
    }

    const user = await User.findByUsername(username);

    // Validamos que el código exista, no haya expirado y coincida.
    if (
      !user ||
      !user.twoFACode ||
      !user.twoFACodeExpiresAt ||
      user.twoFACode !== code ||
      user.twoFACodeExpiresAt < new Date()
    ) {
      return res.status(401).end();
    }

    // Código correcto: limpiamos los campos 2FA.
    user.twoFACode = null;
    user.twoFACodeExpiresAt = null;
    await user.save();

    // Generamos y devolvemos el JWT.
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token });
  } catch (error) {
    return res.status(500).end();
  }
};

// GET /api/auth/verify-email
// Recibe el token de verificación, lo valida, 
// activa la cuenta y borra el token que se habia enviado por email, es de un solo uso.
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).end();
    }

    const user = await User.findOne({
      verificationTokenEmail: token,
      verificationTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).end();
    }

    // Si el token es valido, activamos la cuenta y 
    // limpiamos los campos de verificacion.
    user.status = 'active';
    user.verificationTokenEmail = null;
    user.verificationTokenExpiresAt = null;
    await user.save();

    return res.status(200).end();
  } catch (error) {
    return res.status(500).end();
  }
};

module.exports = { lookupIdentity, register, login, verify2FA, googleAuth, googleRegister, verifyEmail };