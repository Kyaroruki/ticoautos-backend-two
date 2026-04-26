const { gql } = require('apollo-server-express');

const typeDefs = gql`

  type User {
    _id: ID
    username: String
    name: String
  }

  type Answer {
    _id: ID
    text: String
    user: User
    date: String
  }

  type Vehicle {
    _id: ID
    brand: String
    model: String
    year: Int
    price: Float
    description: String
    status: String
    image: String
    owner: User
    date: String   
  }

  type Question {
    _id: ID
    text: String
    user: User
    vehicle: Vehicle
    date: String
    answers: [Answer]
  }

  type VehiclePagination {
    vehicles: [Vehicle]
    total: Int
    page: Int
    pages: Int
  }

  type QuestionResponse {
    isOwner: Boolean
    questions: [Question]
  }

  type Query {
    # AUTH
    lookupIdentity(identifyNumber: String!): Identity

    # VEHICLES
    listVehicles(
      brand: String
      model: String
      minYear: Int
      maxYear: Int
      minPrice: Float
      maxPrice: Float
      status: String
      page: Int
      limit: Int
    ): VehiclePagination

    vehicle(id: ID!): Vehicle
    myVehicles: [Vehicle]

    # QUESTIONS
    vehicleQuestions(vehicleId: ID!): QuestionResponse
    myQuestions: [Question]
    inbox: [Question]
  }

  type Identity {
    identify_number: String
    name: String
    lastname: String
  }
`;

module.exports = typeDefs;