const mongoose = require("mongoose");
const { omitBy, isNil } = require("lodash");
const { Schema } = mongoose;
const moment = require("moment-timezone");
const { ObjectId } = Schema;
const paginateAggregate = require("mongoose-aggregate-paginate-v2");

// const stopSchema = new Schema();
const objectIdToTimestamp = require("objectid-to-timestamp");

const RouteStopSchema = new Schema(
  {
    routeId: { type: ObjectId, ref: "Route", required: true },
    stopId: { type: ObjectId, ref: "Location", required: true },
    order: { type: Number, default: 1 },
    minimum_fare_pickup: { type: String, default: "", index: true },
    minimum_fare_drop: { type: String, default: "", index: true },
    price_per_km_drop: { type: String, default: "", index: true },
    price_per_km_pickup: { type: String, default: "", index: true },
    departure_time: { type: Date, default: "", index: true },
    arrival_time: { type: Date, default: "", index: true },
  },
  { timestamps: true }
);

RouteStopSchema.index({ "stops.location": "2dsphere" });

RouteStopSchema.statics = {
  async updateRouteStop(dataObj, routeId) {
    try {
       let i = 1;

      if (await this.exists({ routeId })) { // if exists update route and if stop not found then create
        dataObj.forEach(async (item) => {
          const objUpdate = {
            order: i++,
            minimum_fare_pickup: item.minimum_fare_pickup,
            minimum_fare_drop: item.minimum_fare_drop,
            price_per_km_pickup: item.price_per_km_pickup,
            price_per_km_drop: item.price_per_km_drop,
          //  departure_time: item.departure_time,
          //  arrival_time: item.arrival_time,
          };
		  
        if (typeof item.location == "object") {
            objUpdate.routeId = routeId;
            objUpdate.stopId = item.location.id;
            await this.findByIdAndUpdate(item.id, objUpdate, { new: true, upsert: true });
          } else {
            objUpdate.routeId = routeId;
            objUpdate.stopId = item.location.id;

            await this.findOneAndUpdate(
              { routeId, stopId: objUpdate.stopId },
              objUpdate,
              { new: true, upsert: true }
            );
          }
      
        });
      } else { // not found create new route stops
        dataObj.forEach(async (item) => {
          const objUpdate = {
            order: item.order,
            duration_pickup: item.duration_pickup,
            duration_drop: item.duration_drop,
            minimum_fare_pickup: item.minimum_fare_pickup,
            minimum_fare_drop: item.minimum_fare_drop,
            price_per_km_pickup: item.price_per_km_pickup,
            price_per_km_drop: item.price_per_km_drop,
         // departure_time: item.departure_time,
         // arrival_time: item.arrival_time,
          };
          objUpdate.routeId = routeId;
          objUpdate.stopId = item.location.id;

          await this.findOneAndUpdate(
            { routeId, stopId: objUpdate.stopId },
            objUpdate,
            { new: true, upsert: true }
          );
        });
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  },
  formatpickup(data) {
    const selectableItems = [];
    data.forEach(async (item) => {
      selectableItems.push({
        id: item._id,
        pickup_distance: (item.actual_distance / 1000).toFixed(1) + " km",
        routeId: item.routeId,
        route_name: item.route_name,
        total_of_stops: item.total_of_stops,
        route_busId: item.route_bus.busId,
        pickup_stop_id: item.stop[0].id,
        pickup_stop_name: item.stop[0].name,
        pickup_stop_order: item.stop[0].order,
        pickup_stop_lat: item.stop[0].location.coordinates[1],
        pickup_stop_lng: item.stop[0].location.coordinates[0],
        pickup_stop_minimum_fare_pickup: item.stop[0].minimum_fare_pickup,
        //  pickup_stop_minimum_fare_drop:item.stop[0].minimum_fare_drop,
        //  pickup_stop_minimum_fare_drop:item.stop[0].price_per_km_drop,
        pickup_stop_minimum_fare_drop: item.stop[0].price_per_km_pickup,
        pickup_stop_departure_time: moment(item.stop[0].departure_time)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_TIMEFORMAT),
      });
    });
    return selectableItems;
  },
  formatdrop(data) {
    console.log(data);
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: item._id,
        drop_distance: (item.actual_distance / 1000).toFixed(1) + " km",
        routeId: item.routeId,
        route_name: item.route_name,
        total_of_stops: item.total_of_stops,
        drop_stop_id: item.stop[0].id,
        drop_stop_name: item.stop[0].name,
        route_busId: item.route_bus.busId,
        drop_stop_order: item.stop[0].order,
        drop_stop_lat: item.stop[0].location.coordinates[1],
        drop_stop_lng: item.stop[0].location.coordinates[0],
        // drop_stop_minimum_fare_pickup:item.stop[0].minimum_fare_pickup,
        drop_stop_minimum_fare_drop: item.stop[0].minimum_fare_drop,
        drop_stop_price_per_km_drop: item.stop[0].price_per_km_drop,
        //  drop_stop_minimum_fare_pickup:item.stop[0].price_per_km_pickup,
        drop_stop_arrival_time: moment(item.stop[0].arrival_time)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_TIMEFORMAT),
      });
    });
    return selectableItems;
  },
  formatstops(data, pickupId, dropId) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: item.id,
        name: item.name,
        pickup: objectIdToTimestamp(item.id) == pickupId,
        drop: objectIdToTimestamp(item.id) == dropId,
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
      });
    });
    return selectableItems;
  },
  transformRouteData(data) {
    const selectableItems = [];
    data.forEach((item) => {
      var hold;
      if (item.drop_stop_order > item.pickup_stop_order) {
        hold = item.drop_stop_order - item.pickup_stop_order; // 4 -1 3
      } else {
        hold = item.pickup_stop_order - item.drop_stop_order;
      }

      selectableItems.push({
        routeId: item.routeId,
        route_name: item.route_name,
        route_busId: item.route_busId,
        total_of_stops: item.total_of_stops.toString(),
        holds: hold.toString(),
        pickup_stop_id: item.pickup_stop_id,
        pickup_stop_name: item.pickup_stop_name,
        pickup_stop_lat: item.pickup_stop_lat,
        pickup_stop_lng: item.pickup_stop_lng,
        pickup_stop_minimum_fare_pickup: item.pickup_stop_minimum_fare_pickup,
        pickup_stop_minimum_fare_drop: item.pickup_stop_minimum_fare_drop,
        pickup_stop_departure_time: item.pickup_stop_departure_time,
        pickup_distance: item.pickup_distance,
        drop_distance: item.drop_distance,
        drop_stop_id: item.drop_stop_id,
        drop_stop_name: item.drop_stop_name,
        drop_stop_order: item.drop_stop_order,
        drop_stop_lat: item.drop_stop_lat,
        drop_stop_lng: item.drop_stop_lng,
        drop_stop_minimum_fare_drop: item.drop_stop_minimum_fare_drop,
        drop_stop_price_per_km_drop: item.drop_stop_price_per_km_drop,
        drop_stop_arrival_time: item.drop_stop_arrival_time,
      });
    });
    return selectableItems;
  },
  transformData(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        routeId: item.routeId._id,
        route_title: item.routeId.title,
        stops: this.transformStopData(item.stops),
      });
    });
    return selectableItems;
  },
  transformStopData(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: item.id,
        name: item.name,
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
      });
    });
    return selectableItems;
  },
};

RouteStopSchema.plugin(paginateAggregate);

module.exports = mongoose.model("Route_Stop", RouteStopSchema);
