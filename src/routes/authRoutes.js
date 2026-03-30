const express = require('express');
const router = express.Router();
// upload procesa la imagen de perfil si el registro la manda.
const upload = require('../middlewares/upload');

const authController = require('../controllers/authController');

router.post('/register', upload.single('profileImage'), authController.register);

router.post('/login', authController.login);

module.exports = router;