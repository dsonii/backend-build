const mongoose = require("mongoose");

const { Schema } = mongoose;

const { ObjectId } = Schema;

const RouteDetailSchema = new Schema(
  {
    // routeId: { type: ObjectId, ref: "Route" },
    locationId: { type: ObjectId, ref: "Location", required: true },
    duration_pickup: { type: String },
    duration_drop: { type: String },
    minimum_fare_pickup: { type: String },
    minimum_fare_drop: { type: String },
    price_per_km_pickup: { type: String },
    price_per_km_drop: { type: String },
    arrival_time: { type: Date },
    duration: { type: String, default: "" },
  },
  { timestamps: true }
);

RouteDetailSchema.statics = {
  async insertRouteDetail(dataObj) {
    try {
      const arrRouteDetails = [];
      dataObj.forEach(async (item) => {
        const objUpdate = {
          locationId: item.location.locationId,
          duration_pickup: item.duration_pickup,
          duration_drop: item.duration_drop,
          minimum_fare_pickup: item.minimum_fare_pickup,
          minimum_fare_drop: item.minimum_fare_drop,
          price_per_km_pickup: item.price_per_km_pickup,
          price_per_km_drop: item.price_per_km_drop,
          duration: item.duration ? item.duration : "",
          arrival_time: item.arrival_time ? item.arrival_time : "",
        };
        arrRouteDetails.push(objUpdate);
      });
     const getrouteDetails = await this.insertMany(arrRouteDetails);
     const arrIds = getrouteDetails.map((e) => { return e._id; });
     console.log('insert getrouteDetails',arrIds)
      return arrIds;
    } catch (err) {
      console.log("err", err);
      return err;
    }
  },
  async updateRouteDetail(dataObj) {
    try {
      const arrRouteDetails = [];
      let status ='';
      dataObj.forEach(async (item) => {
        arrRouteDetails.push(item._id)
        const objUpdate = {
          duration_pickup: item.duration_pickup,
          duration_drop: item.duration_drop,
          minimum_fare_pickup: item.minimum_fare_pickup,
          minimum_fare_drop: item.minimum_fare_drop,
          price_per_km_pickup: item.price_per_km_pickup,
          price_per_km_drop: item.price_per_km_drop,
          duration: item.duration ? item.duration : "",
          arrival_time: item.arrival_time ? item.arrival_time : "",
        };

        const RouteDetailExists = await this.exists({ _id: item._id });
        if (!RouteDetailExists) {
          objUpdate.locationId = item.locationId.locationId;
          // const saveRDs = new this(objUpdate);
          // const getRDs = await saveRDs.save();
          // console.log(' list ',getRDs);
          status ='insert';
           arrRouteDetails.push(objUpdate);
        }else{
          objUpdate.locationId = item.locationId._id;
          const getupdate = await this.findOneAndUpdate(
            { _id: item._id },
            {
              $set: objUpdate,
            },
            {
              new: true,
            }
          );
          status ='update';
          arrRouteDetails.push(getupdate);
        }

        // if (!RouteDetailExists) {
        //   objUpdate.routeId = "";
        //   objUpdate.locationId = item.locationId.locationId;
        //   await this.create(objUpdate);
        // }
      });

      if(status == 'insert'){
        const getrouteDetails = await this.insertMany(arrRouteDetails);
        const arrIds = getrouteDetails.map((e) => { return e._id; });
        console.log('insert getrouteDetails',arrIds)
         return arrIds;
      }
    } catch (err) {
      console.log("err", err);
      return err;
    }
  },
  routeDetailFormatData(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
      //  routeId: "",
        locationId: item.location.locationId,
        duration_pickup: item.duration_pickup,
        duration_drop: item.duration_drop,
        minimum_fare_pickup: item.minimum_fare_pickup,
        minimum_fare_drop: item.minimum_fare_drop,
        price_per_km_pickup: item.price_per_km_pickup,
        price_per_km_drop: item.price_per_km_drop,
        duration: item.duration ? item.duration : "",
        arrival_time: item.arrival_time ? item.arrival_time : "",
      });
    });
    return selectableItems;
  },
  transformLoad(rows) {
    const selectableItems = [];
    rows.forEach((item) => {
      selectableItems.push({
        position: {
          lat: item.location.coordinates[1],
          lng: item.location.coordinates[0],
        },
      });
    });
    return selectableItems;
  },
};
module.exports = mongoose.model("RouteDetail", RouteDetailSchema);
