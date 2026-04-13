const express = require('express');
const router = express.Router();
// upload procesa la imagen de perfil si el registro la manda.
const upload = require('../middlewares/upload');

const authController = require('../controllers/authController');

router.get('/identity/:identifyNumber', authController.lookupIdentity);
router.get('/verify-email', authController.verifyEmail);//NUEVO: Ruta para verificar el email con el token que se le envio al usuario por correo

router.post('/register', upload.single('profileImage'), authController.register);

router.post('/login', authController.login);

// Rutas para Google OAuth2
router.post('/google', authController.googleAuth);
router.post('/google/register', authController.googleRegister);

module.exports = router;