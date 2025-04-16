const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const BusSchedule = require("../models/busSchedule.model");
const busScheduleLocation = require("../models/busScheduleLocation.model");
const mongoose = require("mongoose");
const busScheduleModel = require("../models/busSchedule.model");

exports.search = async (req, res, next) => {
  try {
    const { search } = req.query;

    const condition = search
      ? {
          // $or: [
          route_name: { $regex: `(\s+${search}|^${search})`, $options: "i" },
          status: true,
        }
      : { status: true };
    const result = await BusSchedule.aggregate([
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          status: 1,
          routeId: { $ifNull: ["$route._id", ""] },
          route_name: { $ifNull: [{ $concat: ["$route.title"] }, "-"] },
          departure_time: 1,
          arrival_time: 1,
        },
      },
      {
        $match: condition,
      },
      {
        $sort: {
          route_name: -1,
        },
      },
    ]); //find(condition).lean();
    res.json({
      total_count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List bus schedule
 * @public
 */
exports.list = async (req, res) => {
  try {
    let condition = req.query.global_search
      ? {
          $or: [
            {
              title: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
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

    if (req.query.routeId) {
      condition = { routeId: mongoose.Types.ObjectId(req.query.routeId) };
    }

    const aggregateQuery = BusSchedule.aggregate([
      //   {
      //     $lookup: {
      //       from: "bus_schedule_locations",
      //       let: { busScheduleId: "$_id" },
      //       pipeline: [
      //         {
      //           $match: { $expr: { $eq: ["$busScheduleId", "$$busScheduleId"] } },
      //         },
      //         {
      //           $lookup: {
      //             from: "locations",
      //             let: { stopId: "$stopId" },
      //             pipeline: [
      //               { $match: { $expr: { $eq: ["$_id", "$$stopId"] } } },
      //               {
      //                 $project: {
      //                   _id: 0,
      //                   title: 1,
      //                 },
      //               },
      //             ],
      //             as: "location",
      //           },
      //         },
      //         {
      //           $unwind: "$location",
      //         },
      //         {
      //           $project: {
      //             location: 1,
      //             stopId: 1,
      //             departure_time: 1,
      //             arrival_time: 1,
      //           },
      //         },
      //       ],
      //       as: "bus_schedule_location",
      //     },
      //   },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          routeId: 1,
          bus_name: { $ifNull: ["$bus.name", "-"] },
          route_name: { $ifNull: ["$route.title", "-"] },
          departure_to_arrival_time: {
            $concat: [
              {
                $dateToString: {
                  format: "%H:%M",
                  date: "$departure_time",
                  timezone: DEFAULT_TIMEZONE,
                },
              },
              " to ",
              {
                $dateToString: {
                  format: "%H:%M",
                  date: "$arrival_time",
                  timezone: DEFAULT_TIMEZONE,
                },
              },
            ],
          },
          start_to_end: {
            $concat: [
              {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$start_date",
                  timezone: DEFAULT_TIMEZONE,
                },
              },
              " to ",
              {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$end_date",
                  timezone: DEFAULT_TIMEZONE,
                },
              },
            ],
          },
          departure_time: 1,
          arrival_time: 1,
          status: {
            $cond: {
              if: { $eq: ["$status", true] },
              then: "Active",
              else: "Inactive",
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
        docs: "busschedules",
      },
      sort,
    };

    const result = await BusSchedule.aggregatePaginate(aggregateQuery, options);

    res.status(httpStatus.OK);
    res.json({ data: result });
  } catch (error) {
    console.log(error);
    return error;
  }
};
/**
 * Get bus schedule
 * @public
 */
exports.get = async (req, res) => {
  try {
    const getBusSchedule = await BusSchedule.aggregate([
      {
        $lookup: {
          from: "bus_schedule_locations",
          let: { busScheduleId: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$busScheduleId", "$$busScheduleId"] } },
            },
            {
              $lookup: {
                from: "locations",
                let: { stopId: "$stopId" },
                pipeline: [
                  {
                    $match: {
                      $and: [{ $expr: { $eq: ["$_id", "$$stopId"] } }],
                    },
                  },
                  {
                    $project: {
                      _id: 0,
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
                location: 1,
                stopId: 1,
                departure_time: 1,
                arrival_time: 1,
                order:1
              },
            },
            {
              $sort:{order:1}
            }
          ],
          as: "bus_schedule_location",
        },
      },
      {
        $lookup: {
          from: "routes",
          //   localField: "routeId",
          //   foreignField: "_id",
          let: { routeId: "$routeId" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$routeId"] } },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                title: 1,
              },
            },
          ],
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          stops: {
            $map: {
              input: "$bus_schedule_location",
              as: "schedule_location",
              in: {
                id: "$$schedule_location._id",
                stopId: "$$schedule_location.stopId",
                location: "$$schedule_location.location",
                departure_time: "$$schedule_location.departure_time",
                arrival_time: "$$schedule_location.arrival_time",
              },
            },
          },
          every: 1,
          routeId: { $ifNull: ["$route", {}] },
          busId: 1,
          departure_time: 1,
          arrival_time: 1,
          start_date: 1,
          end_date: 1,
          status: 1,
          createdAt: 1,
        },
      },
      {
        $match: { id: mongoose.Types.ObjectId(req.params.busScheduleId) },
      },
    ]);

    res.status(httpStatus.OK);
    res.json({
      message: "Single route successfully.",
      data: getBusSchedule[0], //Route.transFormSingleData(route),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create  bus schedule
 * @public
 */
exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      every,
      routeId,
      busId,
      arrival_time,
      departure_time,
      start_date,
      end_date,
      stops,
      status,
    } = req.body;
    // Start session
    await session.startTransaction();
    const busSchedule = await new BusSchedule({
      every,
      routeId: routeId.value,
      busId,
      departure_time,
      arrival_time,
      start_date,
      end_date,
      status,
    }).save();
    if (busSchedule) {
      await busScheduleLocation.createOrUpdate(busSchedule._id, stops);
      // finish transcation
      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.CREATED);
      return res.json({
        status: true,
        message: "Vehicle schedule create successfully",
      });
    }
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    return error;
  }
};

/**
 * Update bus schedule
 * @public
 */
exports.update = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      every,
      routeId,
      busId,
      arrival_time,
      departure_time,
      start_date,
      end_date,
      stops,
      status,
    } = req.body;
    // Start session
    await session.startTransaction();
    const busScheduleexists = await BusSchedule.findById(
      req.params.busScheduleId
    ).exec();
    if (busScheduleexists) {
      const objUpdate = {
        every,
        routeId: routeId.value,
        busId,
        departure_time,
        arrival_time,
        start_date,
        end_date,
        status,
      };
      const updateBusSchedule = await BusSchedule.findByIdAndUpdate(
        req.params.busScheduleId,
        {
          $set: objUpdate,
        },
        {
          new: true,
        }
      );
      if (updateBusSchedule) {
        await busScheduleLocation.createOrUpdate(
          req.params.busScheduleId,
          stops
        );
        // finish transcation
        await session.commitTransaction();
        session.endSession();

        res.status(httpStatus.CREATED);
        return res.json({
          status: true,
          message: "Vehicle schedule updated successfully",
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

/**
 * Update Status bus schedule
 * @param status
 * @public
 */
exports.status = async (req, res) => {
  try {
    const { status } = req.body;
    const update = await BusSchedule.updateOne(
      { _id: req.params.busScheduleId },
      { status: status == "Active" ? "true" : "false" }
    );
    if (update) {
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
    console.log(error);
    return error;
  }
};

/**
 * Delete bus schedule
 * @public
 */
exports.remove = async (req, res) => {
  BusSchedule.deleteOne({
    _id: req.params.busScheduleId,
  })
    .then(async () => {
      await busScheduleLocation.deleteMany({
        busScheduleId: req.params.busScheduleId,
      });
      res.status(httpStatus.OK).json({
        status: true,
        message: "Vehicle Schedule deleted successfully.",
      });
    })
    .catch(e => next(e));
};
