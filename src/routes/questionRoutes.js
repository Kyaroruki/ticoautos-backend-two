const express = require('express');
const router = express.Router();

const questionController = require('../controllers/questionController');
// Este middleware exige JWT valido antes de entrar a la logica.
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/inbox', authMiddleware, questionController.getOwnerInbox);
router.get('/my-questions', authMiddleware, questionController.getMyQuestions);
router.get('/vehicle/:vehicleId', authMiddleware, questionController.getVehicleQuestions);
router.post('/vehicle/:vehicleId', authMiddleware, questionController.createQuestion);
router.post('/:questionId/answer', authMiddleware, questionController.createAnswer);

// Exportamos el router para montarlo en /api/questions.
module.exports = router;