const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Route = require("../models/route.model");
const RouteStop = require("../models/routeStop.model");
const RouteDetail = require("../models/routeDetail.model");
const BusSchedule = require("../models/busSchedule.model");
const s3 = require("../../config/s3");
const base64Img = require("base64-img");
const faker = require("../helpers/faker");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const mongoose = require('mongoose');
const busSchedule = require("../services/busSchedule.service");

exports.testData = (req, res) => {
  const d = faker.seedDrivers("123456");
  res.status(httpStatus.OK);
  res.json({ d });
};

exports.load = async (req, res) => {
  try {
    const route = await Route.find({ status: true }).sort({ _id: -1 });
    res.status(httpStatus.OK);
    res.json({
      message: "stop load successfully.",
      data: await Route.transformOptions(route),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.loadStops = async (req, res) => {
  try {
       const { routeId } = req.params;
    //const getRouteStops = await RouteStop.find({ routeId }).lean();
    const getRouteStops = await RouteStop.aggregate([
      {
        $match: { routeId: mongoose.Types.ObjectId(routeId) },
      },
      {
        $lookup: {
          from: "locations",
          let: { stopId: "$stopId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$stopId"] } } },
            {
              $project: {
                _id: 0,
                id: "$_id",
                address: 1,
                title: 1,
              },
            },
          ],
          as: "location",
        },
      },
      {
        $unwind: "$location",
      },
      {
        $project: {
          _id: 0,
          stopId: { $ifNull: ["$location.id", "-"] },
          location_title: { $ifNull: ["$location.title", "-"] },
          departure_time: "",
          arrival_time: "",
        },
      },
    ]);

    res.status(httpStatus.OK);
    res.json({
      message: "stop load successfully.",
      data: getRouteStops,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};



exports.loadData = async (req, res, next) => {
  try {
    const result = await Route.aggregate([
      {
        $match: { status: true },
      },
      {
        $lookup: {
          from: "timetables", // Name of the timetable collection
          localField: "_id", // Field in the "routes" collection
          foreignField: "routeId", // Field in the "timetable" collection
          as: "timetables" // New field to store matching timetables
        }
      },
      {
        $match: {
          timetables: { $ne: [] } // Only routes with timetables
        }
      },
      {
        $sort:{ createdAt:-1}
      },
      {
        $project:{
            _id:0,
            value:"$_id",
            text:"$title"  
        }
      },
    ]);
 
     res.json({ total_count: result.length, items: result });
  } catch (error) {
    next(error);
  }
};


exports.search = async (req, res, next) => {
  try {
    const { search } = req.params;
    const condition = search
      ?
      {
        title: { $regex: `(\s+${search}|^${search})`, $options: 'i' },
        status:true
      }
      : { status:true};

      console.log("result",condition)
    const result = await Route.find(condition).lean();
 
    res.json({ total_count: result.length, items: await Route.transformOptions(result) });
  } catch (error) {
    next(error);
  }
};

exports.searchroute = async (req, res) => {
    try {
      var {
        pickup_lat,
        pickup_long,
        drop_lat,
        drop_long,
      } = req.body.params;
      const current_time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric"});

      const getnearestData = await busSchedule.nearestData(
        parseFloat(pickup_long),
        parseFloat(pickup_lat),
        "",
        parseFloat(drop_long),
        parseFloat(drop_lat),
        "",
        current_time
      );

      if (getnearestData.length > 0) {
        res.json({
          message: "Successfully found route",
          data: getnearestData,
          status: true,
        });
      } else {
        res.json({
          message: "notfound route",
          data: "",
          status: false,
        });
      }
    } catch (err) {
      res.json({
        message: "notfound route",
        data: "",
        status: false,
      });
    }
  };



/**
 * Get route by locationId
 * @public
 */
exports.getLocationRoute = async (req, res) => {
  try {
    if (req.params.locationId) {
      console.log("getLocationRoute", req.params.locationId);
      const route = await Route.find({
        locationId: req.params.locationId,
        status: true,
      }).sort({ _id: -1 });
      res.status(httpStatus.OK);
      res.json({
        message: "stop load successfully.",
        data: Route.transformOptions(route),
        status: true,
      });
    } else {
      res.json({
        message: "locationId not found.",
        status: false,
      });
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get route
 * @public
 */
exports.get = async (req, res) => {
   try {
    const route = await Route.aggregate([
      {
        $lookup: {
          from: "route_stops",
          let: { routeId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$routeId", "$$routeId"] } } },
            {
              $lookup: {
                from: "locations",
                let: { stopId: "$stopId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$stopId"] } } },
                  {
                    $project: {
                      _id: 0,
		      id:"$_id",
                      address: 1,
                      title: 1,
                      coordinates: "$location.coordinates",
                      type: 1,
                    },
                  },
                ],
                as: "location",
              },
            },
            {
              $unwind: "$location",
            },
            {
              $project: {
				routeId: 1,
                stopId: 1,
                order: 1,
                location: 1,
                minimum_fare_pickup: 1,
                minimum_fare_drop: 1,
                price_per_km_drop: 1,
                price_per_km_pickup: 1,
                departure_time: 1,
                arrival_time: 1,
              },
            },
          ],
          as: "route_stop",
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: 1,
          stops: {
            $map: {
              input: "$route_stop",
              as: "stop",
              in: {
                id: "$$stop._id",
				routeId: "$$stop.routeId",
                stopId: "$$stop.stopId",
                location: "$$stop.location",
                order: "$$stop.order",
                minimum_fare_pickup: "$$stop.minimum_fare_pickup",
                minimum_fare_drop: "$$stop.minimum_fare_drop",
                price_per_km_drop: "$$stop.price_per_km_drop",
                price_per_km_pickup: "$$stop.price_per_km_pickup",
              },
            },
          },
          status: 1,
        },
      },
      {
        $match: { id: mongoose.Types.ObjectId(req.params.routeId) },
      },
    ]);
    res.status(httpStatus.OK);
    res.json({
      message: "Single route successfully.",
      data: route[0], //Route.transFormSingleData(route),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create new bus
 * @public
 */
exports.create = async (req, res, next) => {
    const session = await mongoose.startSession();
  try {
    const { title, stops, status } = req.body;

    // Start session
    await session.startTransaction();
	let lastIntegerId = 1;
    const lastRoute = await Route.findOne({}).sort({ 'integer_id': -1 } );
    lastIntegerId = lastRoute ? (parseInt(lastRoute.integer_id) + lastIntegerId) : lastIntegerId; // auto increment
    
	const route = await new Route({
      title,
      status,
	  integer_id:lastIntegerId
    }).save();
    if (route) {
      await RouteStop.updateRouteStop(stops, route._id);
      // finish transcation
      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.CREATED);
      return res.json({
        status: true,
        message: "route create successfully",
      });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Update existing routes
 * @public
 */

exports.update = async (req, res, next) => {
 const session = await mongoose.startSession();
  try {
    const { title, stops, status } = req.body;
    // Start session
    await session.startTransaction();
    const routeexists = await Route.findById(req.params.routeId).exec();
    if (routeexists) {
      const objUpdate = {
        title,
        status,
      };
      const updateroute = await Route.findByIdAndUpdate(
        req.params.routeId,
        {
          $set: objUpdate,
        },
        {
          new: true,
        }
      );
      if (updateroute) {
        await RouteStop.updateRouteStop(stops, req.params.routeId);
        // finish transcation
        await session.commitTransaction();
        session.endSession();

        res.status(httpStatus.CREATED);
        return res.json({
          status: true,
          message: "route updated successfully",
        });
      }
    } else {
      // finish transcation
      await session.commitTransaction();
      session.endSession();
      res.status(httpStatus.OK);
      res.json({
        status: true,
        message: "No route found.",
      });
    }
  } catch (error) {
    console.log("error", error);
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
};

exports.status = async (req, res, next) => {
  try {
    const { status } = req.body;
    const update = await Route.updateOne(
      { _id: req.params.routeId },
      { status: status == "Active" ? "true" : "false" }
    );
    if (update.n > 0) {
      res.json({
        message: `status now is ${status}.`,
        status: true,
      });
    } else {
      res.json({
        message: `updated failed.`,
        status: false,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get bus list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const condition = req.query.global_search
      ? {
          $or: [
            {
              title: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
			{
              integer_id: parseInt(req.query.global_search),
            },
            // { max_seats: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
            // {layout : { $regex: new RegExp(req.query.global_search), $options: 'i' } },
            { status: req.query.global_search != "InActive" },
            // { last_seat: req.query.global_search != false},
          ],
        }
      : {};

    let sort = {};
    if (!req.query.sort) {
      sort = { createdAt: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = { [data.name]: data.order != "none" ? data.order : "asc" };
    }

    const aggregateQuery = Route.aggregate([
      {
        $lookup: {
          from: "route_stops",
          localField: "_id",
          foreignField: "routeId",
          as: "route_stop",
        },
      },
      {
        $unwind: "$route_stop",
      },
      {
        $group: {
          _id: "$_id",
          total_stops: {
            $sum: 1,
          },
		  integer_id: { $first: "$integer_id" },
          title: { $first: "$title" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          // Add other fields from 'routes' collection if needed
        },
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
		  integer_id: 1,
          title: 1,
          total_stops: 1,
          status: {
            $cond: {
              if: { $eq: ["$status", true] },
              then: "Active",
              else: "InActive",
            },
          },
          createdAt: 1,
        },
      },
      {
        $match: condition,
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.per_page || 5,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "routes",
      },
      sort,
    };

    const result = await Route.aggregatePaginate(aggregateQuery, options);

    res.json({ data: result });
	  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus
 * @public
 */
exports.remove = (req, res, next) => {
    BusSchedule.findOne({ routeId: req.params.routeId })
    .then((result) => {
      if (result) {
        res.status(httpStatus.OK).json({
          status: false,
          message: "Delete vehicle schedule first.",
        });
      }
    })
    .then(() => {
      Route.deleteOne({
        _id: req.params.routeId,
      })
        .then(() =>
          RouteStop.deleteMany({
            routeId: req.params.routeId,
          }).then(() => {
            res.status(httpStatus.OK).json({
              status: true,
              message: "Route deleted successfully.",
            });
          })
        )
        .catch(e => next(e));
    });
};

/**
 * Delete route detail
 * @public
 */
exports.removeRouteDetail = (req, res, next) => {
  RouteDetail.exists({ _id: req.params.routeDetailId }).then((response) => {
    if (response) {
      RouteDetail.deleteOne({
        _id: req.params.routeDetailId,
      }).then(() => {
        res
          .status(httpStatus.OK)
          .json({
            status: true,
            message: "stops deleted successfully.",
          })
          .catch(e => next(e));
      });
    }
  });
};
