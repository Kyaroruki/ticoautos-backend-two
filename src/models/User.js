
const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({

    username: {
        required: true,
        type: String,
        unique: true
    },

    password: {
        type: String,
        default: ''
    },

    googleId: {
        type: String,
        default: null
    },

    email: {
        required: true,
        type: String,
        unique: true
    },

    name: {
        required: true,
        type: String
    },

    lastname: {
        required: true,
        type: String
    },

    identify_number: {
        required: true,
        type: Number
    },

    phone_number: {
        type: String,
        required: true
    },

    profileImage: {
        type: String,
        default: ''
    },

    date: {
        type: Date,
        default: Date.now
    }
});

UserSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

UserSchema.statics.createUser = function(data) {
  return this.create(data);
};

module.exports = mongoose.model('User', UserSchema);

