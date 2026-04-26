const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Vehicle = require('../models/Vehicle');

const createQuestion = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const trimmed = (content || '').trim();
    if (!trimmed) {
      return res.status(400).json({ message: 'The question cannot be empty.' });
    }

    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (String(vehicle.owner) === String(userId)) {
      return res.status(403).json({ message: 'You cannot ask questions about your own vehicle.' });
    }

    // Antes de crear una nueva pregunta, revisamos si el usuario ya tiene una pregunta sin responder 
    const lastQuestion = await Question.findLatestByVehicleAndUser(vehicleId, userId);

    // Si existe una pregunta previa, revisamos si ya fue respondida.
    if (lastQuestion) {
      const hasAnswer = await Answer.hasForQuestion(lastQuestion._id);
      // Si aun no la responden, bloqueamos una nueva para mantener el flujo 1 a 1.
      if (!hasAnswer) {
        return res.status(409).json({
          message:
            'You already have a pending question. Wait for the seller\'s reply before asking again.',
          pendingQuestionId: lastQuestion._id,
        });
      }
    }

    const question = new Question({
      text: trimmed,
      user: userId,
      vehicle: vehicleId,
    });
    await question.save();

    //devolvemos las preguntas juntos con el usuario y nombre de usuario
    const populated = await Question.findById(question._id)
      .populate('user', 'username name')
      .lean();

    // vuelve a buscarla y reemplaza el user que era solo un id por 
    // los datos del usuario.
    return res.status(201).json({ ...populated, answers: [] });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating question', error });
  }
};

// Ruta real: POST /api/questions/:questionId/answer
const createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const question = await Question.findById(questionId);

    if (!question) return res.status(404).json({ message: 'Question not found' });

    const vehicle = await Vehicle.findById(question.vehicle);

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Solo el dueño del vehiculo puede contestar la pregunta.
    if (String(vehicle.owner) !== String(userId)) {
      return res.status(403).json({ message: 'Only the vehicle owner can answer.' });
    }

    // Revisamos si ya habia una respuesta para mantener una sola respuesta por pregunta.
    const existing = await Answer.hasForQuestion(questionId);
    if (existing) {
      return res.status(409).json({ message: 'This question has already been answered.' });
    }

    const answer = new Answer({
      text: content,
      user: userId,
      question: questionId,
    });

    await answer.save();
    //vuelve a buscarla y reemplaza el user que era solo un id por los datos del usuario.
    const populated = await Answer.findById(answer._id).populate('user', 'username name').lean();
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error creating answer', error });
  }
};

module.exports = {
  createQuestion,
  createAnswer
};
