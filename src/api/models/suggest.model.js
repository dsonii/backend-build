const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require("moment-timezone");
const mongoosePaginate = require("mongoose-paginate-v2");

const SuggestSchema = new mongoose.Schema(
  {
    pickup: {
      address: { type: String, default: "", index: true, required: true },
      coordinates: [Number],
      city: { type: String, index: true },
      state: { type: String, index: true },
    },
    drop: {
      address: { type: String, default: "", index: true, required: true },
      coordinates: [Number],
      city: { type: String, index: true },
      state: { type: String, index: true },
    },
    userId: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

SuggestSchema.statics = {
  transformSingleData(item) {
    return {
      id: item._id,
      pickup_address: item.pickup.address,
      drop_address: item.drop.address,
      userId: item.userId._id,
      user_name: item.userId.firstname + " " + item.userId.lastname,
    };
  },
  transformData: (data) => {
    const selectableItems = [];
    let i = 1;
    data.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item._id,
        pickup_address: item.pickup.address,
        drop_address: item.drop.address,
        userId: (item.userId) ? item.userId._id : '',
        userId_firstname: (item.userId) ? item.userId.firstname + " " + item.userId.lastname : '',
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_DATEFORMAT),
      });
    });
    return selectableItems;
  },
};

SuggestSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Suggest", SuggestSchema);
