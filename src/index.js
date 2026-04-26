require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const { getUserFromToken } = require('./middlewares/authMiddleware');

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

// GRAPHQL
async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || "";
      const user = await getUserFromToken(authHeader);
      return { user };
    }
  });

  await server.start();

  server.applyMiddleware({
    app,
    path: '/graphql'
  });

  app.listen(process.env.PORT, () => {
    console.log(`REST corriendo en puerto ${process.env.PORT}`);
    console.log(`GraphQL listo en http://localhost:${process.env.PORT}/graphql`);
  });
}

startServer();