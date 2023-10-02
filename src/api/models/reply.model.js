const mongoose = require('mongoose');
// const objectIdToTimestamp = require("objectid-to-timestamp");
// const moment = require("moment-timezone");
const { Schema } = mongoose;
const { ObjectId } = Schema;

const ReplySchema = new mongoose.Schema({
    helperId: { type: ObjectId, ref: 'Helper', required: true },
    userId: { type: ObjectId, ref: 'User', default: null },
    adminId: { type: ObjectId, ref: 'Admin', default: null },
    title: { type: String, default: '',index:true },
    content: { type: String, default: '',index:true  }
}, {
    timestamps: true
});



module.exports = mongoose.model('Reply', ReplySchema);
