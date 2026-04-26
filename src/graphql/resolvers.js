const Vehicle = require('../models/Vehicle');
const Question = require('../models/Question');
const { fetchPadronPerson } = require('../utils/padronService');

module.exports = {
  Query: {

    // AUTH
    lookupIdentity: async (_, { identifyNumber }) => {
      try {
        return await fetchPadronPerson(identifyNumber);
      } catch (err) {
        console.error("lookupIdentity error:", err);
        return null;
      }
    },

    // VEHICLES CON FILTROS Y PAGINACION
    listVehicles: async (_, args) => {
      try {
        const {
          brand, model, minYear, maxYear,
          minPrice, maxPrice, status,
          page = 1, limit = 6
        } = args;

        const filter = {};

        if (brand) filter.brand = brand;
        if (model) filter.model = model;
        if (status) filter.status = status;

        if (minYear || maxYear) {
          filter.year = {};
          if (minYear) filter.year.$gte = Number(minYear);
          if (maxYear) filter.year.$lte = Number(maxYear);
        }

        if (minPrice || maxPrice) {
          filter.price = {};
          if (minPrice) filter.price.$gte = Number(minPrice);
          if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const skip = (page - 1) * limit;

        const total = await Vehicle.countWithFilters(filter);
        const vehicles = await Vehicle.listWithFilters(filter, skip, limit);

        return {
          vehicles,
          total,
          page,
          pages: Math.ceil(total / limit)
        };

      } catch (error) {
        console.error(error);
        return {
          vehicles: [],
          total: 0,
          page: 1,
          pages: 1
        };
      }
    },

    // VEHICULO POR ID
    vehicle: async (_, { id }) => {
      try {
        return await Vehicle.findByIdWithOwner(id);
      } catch (err) {
        console.error("vehicle error:", err);
        return null;
      }
    },

    // VEHICULOS PROPIOS
    myVehicles: async (_, __, { user }) => {
      try {
        if (!user) return []; 

        return await Vehicle.find({ owner: user._id })
          .populate('owner', 'name');

      } catch (err) {
        console.error("myVehicles error:", err);
        return [];
      }
    },

    // QUESTIONS DE VEHICULO
    vehicleQuestions: async (_, { vehicleId }, { user }) => {
      try {
        if (!user) return { isOwner: false, questions: [] };

        const vehicle = await Vehicle.findById(vehicleId).lean();
        if (!vehicle) return { isOwner: false, questions: [] };

        const isOwner = String(vehicle.owner) === String(user._id);

        const filter = isOwner
          ? { vehicle: vehicleId }
          : { vehicle: vehicleId, user: user._id };

        const questions = await Question.findWithAnswers(filter);

        return { isOwner, questions };

      } catch (err) {
        console.error("vehicleQuestions error:", err);
        return { isOwner: false, questions: [] };
      }
    },

    //QUESTIONS PROPIAS
    myQuestions: async (_, __, { user }) => {
      try {
        if (!user) return [];

        return await Question.findWithAnswers({ user: user._id });

      } catch (err) {
        console.error("myQuestions error:", err);
        return [];
      }
    },

    // INBOX
    inbox: async (_, __, { user }) => {
      try {
        if (!user) return [];

        const ownedVehicles = await Vehicle.find({ owner: user._id }).select('_id');
        const ids = ownedVehicles.map(v => v._id);

        if (!ids.length) return [];

        return await Question.findWithAnswers({ vehicle: { $in: ids } });

      } catch (err) {
        console.error("inbox error:", err);
        return [];
      }
    }
  }
};