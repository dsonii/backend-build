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

PassengerSchema.statics = {
  transformFormatData(data) {
       const selectableItems = [];
       data.forEach((item) => {
           selectableItems.push({
               userId:item.userId,
               bookingId: item.bookingId,
               busId: item.busId,
               fullname: item.fullname,
               age: item.age,
               gender: item.gender,
               seat: item.seat
           });
       });
       return selectableItems;
   },
   passengerFormatData(bookingId,busId,userId,data) {
       const selectableItems = [];
       data.forEach((item) => {
           selectableItems.push({
               userId:userId,
               bookingId: bookingId,
               busId: busId,
               fullname: item.fullname,
               age: item.age,
               gender: item.gender,
               seat: item.seat
           });
       });
       return selectableItems;
   },
}

passengerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Passenger", passengerSchema);
