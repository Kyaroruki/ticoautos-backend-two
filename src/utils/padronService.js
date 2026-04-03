const mongoose = require('mongoose');
const connectDB = require('../config/db');

const getPadronDatabaseConfig = connectDB.getPadronDatabaseConfig;

// --- CONEXIÓN SECUNDARIA al padrón ---
let padronConnection = null;
function getPadronConnection() {
  if (!padronConnection) {
    const uri = process.env.PADRON_DATABASE_URL || 'mongodb://127.0.0.1:27017';
    const dbName = process.env.PADRON_DB_NAME;
    padronConnection = mongoose.createConnection(uri, { dbName });
  }
  return padronConnection;
}

// Busca la persona en Mongo usando CEDULA
async function findPadronPersonInMongo(id) {
  // Usa la conexión secundaria SOLO para el padrón
  const collection = getPadronConnection().collection(process.env.PADRON_COLLECTION);
  const idNum = Number(id);
  const person = await collection.findOne(
    { CEDULA: idNum },
    {
      projection: {
        _id: 0,
        CEDULA: 1,
        NOMBRE: 1,
        PAPELLIDO: 1,
        SAPELLIDO: 1
      }
    }
  );
  return normalizeRecord(person);
}

// Convierte el documento del padrón al formato que usa el backend.
function normalizeRecord(person) {
  //si person no viene se termina.
  if (!person) {
    return null;
  }

  // llenamos los campos con los valores obtenidos de la db.
  const id = String(person.CEDULA);
  const name = String(person.NOMBRE);
  const firstLastname = String(person.PAPELLIDO);
  const secondLastname = String(person.SAPELLIDO);
  // Unimos los apellidos en un solo string
  const lastname = [firstLastname, secondLastname].filter(Boolean).join(' ');

  if (!id || !name || !lastname) {
    return null;
  }

  return {
    identify_number: id,
    name,
    lastname
  };
}

module.exports = {
  fetchPadronPerson: findPadronPersonInMongo
};
