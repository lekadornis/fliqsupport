const mongoose = require("mongoose");

var SupportSchema = new mongoose.Schema({
   title: {
       type: String,
       require: true,
       trim: true
   }, 
   desc: String,
   content: {
       type: String,
       require: true
    },
   status: Boolean,
   processedStatus: {
        type: Boolean,
        require: false
    },
   createAt: {
       type: Date,
       default: Date.now()
   },
   owner: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "User"
   },
   comments: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }
   ]

})
module.exports = mongoose.model('Support', SupportSchema);