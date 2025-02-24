const mongoose = require("mongoose");
const moment = require("moment-timezone");


const currentLocationSchema = new mongoose.Schema(
  {
    bookingId: { type: Object, ref: 'Booking', required: true },
    old_location: [Number],
    current_location: [Number],
  },
  { timestamps: true }
);


currentLocationSchema.statics = {}

module.exports = mongoose.model("currentLocation", currentLocationSchema);
