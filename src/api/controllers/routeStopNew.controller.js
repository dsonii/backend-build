const RouteStopNew = require("../models/routeStop.model");
const Route = require("../models/route.model");
const RouteStopOld = require("../models/routeStopOld.model");
const RouteStop = require("../models/routeStop.model");
const busScheduleLocation = require("../models/busScheduleLocation.model");
const busSchedule = require("../models/busSchedule.model");
const Timetable = require("../models/timetable.model");
const Location = require("../models/location.model");
const httpStatus = require("http-status");

/**
 * Get route
 * @public
 */
exports.get = async (req, res) => {
  try {
    const getTimetables = await Timetable.find({});
    let busSchedules = [];
    getTimetables.forEach(async (route) => {
      const ifRouteExist = await Route.findById(route.routeId);
      if (ifRouteExist != null) {
        const getStops = await RouteStop.find({
          routeId: route.routeId,
        });

        if (getStops.length > 0) {
          const departure_time = getStops[0].departure_time;
          const arrival_time = getStops[(getStops.length - 1)].arrival_time;
          console.log("departure_time",departure_time)
          console.log("arrival_time",arrival_time)
          const getBusSchedules = await new busSchedule({
            busId: route.busId,
            routeId: route.routeId,
            every: route.every,
            stopId: route.stopId,
            start_date: route.start_date,
            end_date: route.end_date,
            departure_time,
            arrival_time,
          }).save();

          getStops.forEach(async (stop) => {
            await new busScheduleLocation({
              busScheduleId: getBusSchedules._id,
              stopId: stop.stopId,
              departure_time: stop.departure_time,
              arrival_time: stop.arrival_time,
            }).save();
          });
        }
      }
    });

    res.status(httpStatus.OK);
    res.json({
      message: "Single route successfully.",
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get route
 * @public
 */
exports.CreateROuteStops = async (req, res) => {
  try {
    const getRouteStop = await RouteStopOld.find({});

    getRouteStop.forEach(async (route) => {
      const ifRouteExist = await Route.findById(route.routeId);
      if (ifRouteExist != null) {
        route.stops.forEach(async (stop) => {
          const ifExists = await Location.findById(stop.id);
          if (ifExists != null) {
            await new RouteStopNew({
              routeId: route.routeId,
              stopId: ifExists._id,
              order: stop.order,
              minimum_fare_pickup: stop.minimum_fare_pickup,
              minimum_fare_drop: stop.minimum_fare_drop,
              price_per_km_drop: stop.price_per_km_drop,
              price_per_km_pickup: stop.price_per_km_pickup,
              departure_time: stop.departure_time,
              arrival_time: stop.arrival_time,
            }).save();
          }
        });
      }
    });

    res.status(httpStatus.OK);
    res.json({
      message: "Single route successfully.",
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};
