const express = require('express');
const router = express.Router();

const questionController = require('../controllers/questionController');
// Este middleware exige JWT valido antes de entrar a la logica.
const { authMiddleware } = require('../middlewares/authMiddleware');;

router.post('/vehicle/:vehicleId', authMiddleware, questionController.createQuestion);
router.post('/:questionId/answer', authMiddleware, questionController.createAnswer);

module.exports = router;