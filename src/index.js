require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

connectDB();

const app = express();

// Este middleware hace que cualquier JSON enviado en el body quede disponible en req.body.
app.use(bodyParser.json());

app.use(cors({
  origin: '*',
  methods: '*'
}));

const path = require('path'); 
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));

app.listen(process.env.PORT, () => console.log(`Escuchando el puerto ${process.env.PORT}`));