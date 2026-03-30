const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({

    brand: {
        required: true,
        type: String
    },
    model: {
        required: true,
        type: String
    },

    year: {
        required: true,
        type: Number
    },
    price: {
        required: true,
        type: Number
    },
    description: {
        required: true,
        type: String
    },
    status: {
        required: true,
        type: String,
        enum: ['available', 'sold'],
        default: 'available'
    },

    owner: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        required: true,
        type: Date,
        default: Date.now
    },
    image: {
        required: false,
        type: String
    }
});

// Este helper trae un vehiculo por id y poblado con el nombre del dueño.
VehicleSchema.statics.findByIdWithOwner = function(id) {
    return this.findById(id).populate('owner', 'name');
};

// Este helper trae todos los vehiculos de un usuario.
VehicleSchema.statics.listByOwner = function(ownerId) {
    return this.find({ owner: ownerId }).populate('owner', 'name');
};

// Este helper lista vehiculos aplicando filtros, paginacion y orden por fecha descendente.
VehicleSchema.statics.listWithFilters = function(filters, skip, limit) {
    return this.find(filters)
        .populate('owner', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ date: -1 });
};

// Este helper cuenta cuantos documentos cumplen los filtros.
VehicleSchema.statics.countWithFilters = function(filters) {
    return this.countDocuments(filters);
};

module.exports = mongoose.model('Vehicle', VehicleSchema);


