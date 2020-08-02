const mongoose = require("mongoose");
var RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    desc: {
        type: String,
        trim: true
    }
})

module.exports = mongoose.model('Role', RoleSchema);