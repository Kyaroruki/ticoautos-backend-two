require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use('/api', express.json());
app.use(cors({
  origin: '*',
  methods: '*'
}));

const path = require('path'); 
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// REST API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));

app.listen(process.env.PORT, () => {
  console.log(`REST corriendo en puerto ${process.env.PORT}`);
});

// Servicio del padrón en puerto separado
const padronApp = express();
padronApp.use(express.json());
padronApp.use(cors({ origin: '*', methods: '*' }));

const { lookupIdentity } = require('./controllers/authController');
padronApp.get('/identity/:identifyNumber', lookupIdentity);

padronApp.listen(process.env.PADRON_PORT, () => {
  console.log(`Padrón corriendo en puerto ${process.env.PADRON_PORT}`);
});