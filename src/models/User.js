
const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({

    username: {
        required: true,
        type: String,
        unique: true
    },

    password: {
        required: true,
        type: String
    },

    name: {
        required: false,
        type: String
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

