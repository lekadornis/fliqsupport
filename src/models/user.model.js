const mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    }, 
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
    }
 
 })
 module.exports = mongoose.model('User', UserSchema);