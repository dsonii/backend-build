const mongoose = require("mongoose");
const httpStatus = require("http-status");
const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require("moment-timezone");
const mongoosePaginate = require("mongoose-paginate-v2");

/**
 * Passenger Schema
 * @private
 */
const passengerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    fullname: { type: String },
    age: { type: String },
    gender: { type: String },
    seat: { type: String },
    status: { type: Boolean, default: true },
    is_deleted:{type: Boolean, default: false},
  },
  {
    timestamps: true,
  }
);
passengerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Passenger", passengerSchema);
