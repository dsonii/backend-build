const mongoose = require("mongoose");
const httpStatus = require("http-status");
const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require("moment-timezone");
const mongoosePaginate = require("mongoose-paginate-v2");

/**
 * Reminder Schema
 * @private
 */

 const routines = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

 const reminderSchema = new mongoose.Schema({
     userId: { type: ObjectId, ref: "User", required: true },
     bookingId: { type: ObjectId, ref: "Booking", required: true },
     datetime: { type: Date, required: true },
     every:{ type: [String],enum:routines,index:true},
 }, { timestamps: true });


reminderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Reminder", reminderSchema);
