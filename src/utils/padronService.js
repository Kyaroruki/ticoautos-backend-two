const mongoose = require('mongoose');
const connectDB = require('../config/db');

const getPadronDatabaseConfig = connectDB.getPadronDatabaseConfig;

// Busca la persona en Mongo usando CEDULA 
async function findPadronPersonInMongo(id) {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Mongo connection is not ready');
  }

  const { dbName, collectionName } = getPadronDatabaseConfig();
  const padronDb = mongoose.connection.useDb(dbName, { useCache: true });
  const idNum = Number(id);

  // Buscamos el registro que tenga el número de cédula igual al idNum
  // y solo traemos cedula, nombre y apellidos.
  const person = await padronDb.collection(collectionName).findOne(
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
