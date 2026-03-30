const mongoose = require('mongoose');

// Este esquema describe como se guarda una respuesta en MongoDB.
const AnswerSchema = new mongoose.Schema({
    text: {
        required: true,
        type: String
    },

    question: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    },

    user: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    date: {
        type: Date,
        default: Date.now
    }
});

// Este método trae todas las respuestas de varias preguntas, 
// incluye información básica del usuario, las ordena por fecha y las devuelve como objetos simples
AnswerSchema.statics.listByQuestionIdsWithUser = function(questionIds) {
    return this.find({ question: { $in: questionIds } })
        .populate('user', 'username name')
        .sort({ date: 1 })
        .lean();
};

// Este método solo verifica si ya existe alguna respuesta para una pregunta, 
AnswerSchema.statics.hasForQuestion = function(questionId) {
    return this.exists({ question: questionId }); //true o false
};

module.exports = mongoose.model('Answer', AnswerSchema);

