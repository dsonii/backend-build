const mongoose = require("mongoose");
const { omitBy, isNil } = require("lodash");
const paginateAggregate = require("mongoose-aggregate-paginate-v2");
const { Schema } = mongoose;
const { ObjectId } = Schema;

const BusScheduleLocationSchema = new Schema(
  {
    busScheduleId: { type: ObjectId, ref: "Bus_Schedule", required: true },
    stopId: { type: ObjectId, ref: "Location", required: true },
    departure_time: { type: Date, default: "", index: true },
    arrival_time: { type: Date, default: "", index: true },
    order: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);

BusScheduleLocationSchema.statics = {
  async createOrUpdate(busScheduleId, dataObj) {
    try {
      // if exists update route and if stop not found then create
      dataObj.forEach(async (item, index) => {
        let objUpdate = {
          busScheduleId: busScheduleId,
          stopId: item.stopId,
          departure_time: item.departure_time,
          arrival_time: item.arrival_time,
          order: index + 1,
        };
        if (await this.exists({ busScheduleId })) {
          await this.findOneAndUpdate(
            { busScheduleId, stopId: objUpdate.stopId },
            objUpdate,
            { new: true, upsert: true }
          );
        } else {
          await this.findOneAndUpdate(
            { busScheduleId, stopId: objUpdate.stopId },
            objUpdate,
            { new: true, upsert: true }
          );
        }
      });
    } catch (err) {
      console.log(err);
      return err;
    }
  },
};

BusScheduleLocationSchema.plugin(paginateAggregate);

module.exports = mongoose.model(
  "Bus_Schedule_Location",
  BusScheduleLocationSchema
);
