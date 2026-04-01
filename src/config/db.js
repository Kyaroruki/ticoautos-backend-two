const mongoose = require('mongoose');

// Esta funcion llama a la db del padron
function getPadronDatabaseConfig() {
  return {
    dbName: process.env.PADRON_DB_NAME,
    collectionName: process.env.PADRON_COLLECTION
  };
}

// Esta funcion encapsula la conexion a la base de datos.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

//Le agregamos a connectDB la config del padron
connectDB.getPadronDatabaseConfig = getPadronDatabaseConfig;

module.exports = connectDB;