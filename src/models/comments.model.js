const mongoose = require("mongoose");

var CommentSchema = new mongoose.Schema({

   comment: {
       type: String
   }, 
   date: {
       type: Date,
       default: Date.now
    },
   like: {
       type: Number,
       default: 0
    },
   unlike: {
       type: Number,
       default: 0
   },
   by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}
   

})
module.exports = mongoose.model('Comment', CommentSchema);