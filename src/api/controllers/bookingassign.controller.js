const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const BookingAssign = require("../models/bookingAssign.model");
const Route = require("../models/route.model");
const Listeners = require("../events/Listener");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const Driver = require("../models/driver.model");
const moment = require("moment-timezone");
const driverFCM = require("../notifications/driver");
const driverNotification = require("../models/driverNotification.model");
const firebaseUser = require("../services/firebaseUser");
const mongoose = require("mongoose");

/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const result = await BookingAssign.findById(req.params.assignId)
	.populate({ path:"busScheduleId"})
	.populate({ path:"routeId"})
    .populate({ path: "driverId", select: "firstname lastname country_code phone picture" })
    .populate({ path: "assistantId", select: "firstname lastname country_code phone picture" });
   
    res.status(httpStatus.OK);
    res.json({
      message: "Booking Assign fetched successfully.",
      data:await BookingAssign.formatData(result) ,// getBookingAssign.length > 0 ? getBookingAssign[0] : {}, //,await BookingAssign.formatData(result),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create new Booking Assign
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { adminId, route, driver, assistant, dates } = req.body;
    if (!(await BookingAssign.isExistDateTime(driver,route, dates))) {
      const createObj = {
        busScheduleId: route.id,
        routeId: route.routeId,
        driverId: driver ? driver.id : null,
        assistantId: null, //await BookingAssign.filterAssistant(assistant),
        dates,
        adminId,
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
      };

      const saveBookingAssign = await new BookingAssign(createObj).save();
      if (saveBookingAssign) {
        const getDriver = await Driver.findById(
          saveBookingAssign.driverId
        ).select("firstname lastname device_token");

        if (getDriver && getDriver.device_token) {
          const getRoute = await Route.findById(
            saveBookingAssign.routeId
          ).select("title");
		     const title = `New Booking Assign`;
          const content = `Hi ${getDriver.firstname} ${getDriver.lastname},\n You assigned a route: ${getRoute.title}`;

          const payload = {
            title: "New Booking Assigned",
            body: content,
            token: getDriver.device_token,
          };
          await firebaseUser.sendSingleMessage(payload); //title,message,data,token
          driverNotification.create(
		    title,
            content,
            saveBookingAssign.driverId,
            adminId,
            {
              assignId: saveBookingAssign._id,
              routeId: saveBookingAssign.routeId,
            }
          );
        }

        //  Listeners.eventsListener.emit("UPDATE-TIKCET-STATUS", ticketId,'ASSIGNED'); // event to ASSIGNED ticket to driver
        res.status(httpStatus.OK);
        res.json({
          message: "Booking Assigned successfully.",
          data: saveBookingAssign,
          status: true,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: "booking Assign dates already on this route.",
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
    let condition = req.query.global_search
      ? {
          $and: [
            {
              $or: [
                {
                  name: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  seat_booked: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  seat_count: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  "bustypeId.name": {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                { status: req.query.global_search != "inactive" },
              ],
            },
          ],
        }
      : {};

    let sort = {};
    if (!req.query.sort) {
      sort = { createdAt: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = {
        [data.name]: data.order != "none" ? data.order : "asc",
      };
    }

    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);
      if (filtersData.type == "simple") {
        condition = {
          [filtersData.name]: filtersData.text,
        };
      } else if (filtersData.type == "select") {
        condition = {
          [filtersData.name]: { $in: filtersData.selected_options },
        };
      }
    }

    const aggregateQuery = BookingAssign.aggregate([
      {
        $lookup: {
          from: "drivers",
          localField: "driverId",
          foreignField: "_id",
          as: "driver",
        },
      },
      {
        $unwind: "$driver",
      },
	    {
        $lookup: {
          from: "bus_schedules",
          localField: "busScheduleId",
          foreignField: "_id",
          as: "bus_schedule",
        },
      },
      {
        $unwind: "$bus_schedule",
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
		      departure_time: { $ifNull: ["$bus_schedule.departure_time", ""] },
          arrival_time: { $ifNull: ["$bus_schedule.arrival_time", ""] },
          routeId: { $ifNull: ["$route._id", ""] },
          route_name: { $ifNull: ["$route.title", ""] },
          driverId: { $ifNull: ["$driver._id", ""] },
          driver_name: {
            $ifNull: [
              {
                $concat: ["$driver.firstname", " ", "$driver.lastname"],
              },
              "",
            ],
          },
          driver_phone: { $ifNull: [{$concat:["+","$driver.country_code","","$driver.phone"]}, ""] },
              driver_picture: {
            $cond: [
              {
                $regexMatch: {
                  input: "$driver.picture",
                  regex: /^(http|https):\/\//,
                },
              },
              "$driver.picture",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$driver.picture",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.FULL_BASEURL}public/drivers/profiles/default.jpg`,
                  {
                    $concat: [
                      `${process.env.FULL_BASEURL}public/drivers/profiles/`,
                      "$driver.picture",
                    ],
                  },
                ],
              },
            ],
          },
          dates: 1,
          assistantId: null,
          assistant_phone: null,
          assistant_picture: null,
          trip_status: 1,
          location: 1,
          createdAt:1,
        },
      },
    ]);

    //    console.log('1212', sort);
    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "bookingassigns",
      },
      sort,
      // populate: [{ path: "adminId", select: 'firstname' },
      // { path: "driverId", select: 'firstname lastname phone' },
      // { path: "routeId", select: 'title' },
      // { path: "assistantId", select: 'firstname lastname phone' },
      // ],
      // lean: true,
      // leanWithId: true,
    };

    // const result = await BookingAssign.paginate(condition, paginationoptions);
    // result.bookingassigns = await BookingAssign.transformDataLists(result.bookingassigns);

    const result = await BookingAssign.aggregatePaginate(
      aggregateQuery,
      paginationoptions
    );
    res.json({ data: result });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Update new Booking Assign
 * @public
 */
exports.update = async (req, res, next) => {
  try {
   let assignId = req.params.assignId;
    const { adminId, route, driver, assistant, dates, trip_status } = req.body;
    if (await BookingAssign.exists({ _id: assignId })) {
      if (!(await BookingAssign.isExistDateTime(route, dates))) {
        const objUpdate = {
          busScheduleId: route.id,
          routeId: route.routeId,
          driverId: driver ? driver.id : null,
          assistantId: assistant ? assistant.id : null, //await BookingAssign.filterAssistant(assistant),
          dates,
          adminId,
          trip_status,
        };
        const updateBookingAssign = await BookingAssign.findByIdAndUpdate(
          assignId,
          {
            $set: objUpdate,
          },
          {
            new: true,
          }
        );
        if (updateBookingAssign) {
          const getDriver = await Driver.findById(
            updateBookingAssign.driverId
          ).select("firstname lastname device_token");

          if (getDriver && getDriver.device_token) {
            const getRoute = await Route.findById(
              updateBookingAssign.routeId
            ).select("title");
			 const title = `Booking Assign updated`;
            const content = `Hi ${getDriver.firstname} ${getDriver.lastname},\n You assigned a route: ${getRoute.title}`;

            const payload = {
              title,
              body: content,
              token: getDriver.device_token,
            };
            await firebaseUser.sendSingleMessage(payload); //title,message,data,token

            driverNotification.create(
			  title,
              content,
              updateBookingAssign.driverId,
              adminId,
              {
                assignId: updateBookingAssign._id,
                routeId: updateBookingAssign.routeId,
              }
            );
          }
          res.status(httpStatus.OK);
          res.json({
            status: true,
            message: "Booking assign updated successfully.",
            data: updateBookingAssign,
          });
        }
      } else {
        res.status(httpStatus.OK);
        res.json({
          message: "booking Assign dates already on this route.",
          status: false,
        });
      }
    } else {
      res.status(httpStatus.OK).json({
        status: false,
        message: "Booking assign update failed.",
      });
    }
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};
/**
 * delete assign
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    const assignId = req.params.assignId;
    if (await BookingAssign.exists({ _id: assignId })) {
      const deleteBookingAssign = await BookingAssign.deleteOne({
        _id: assignId,
      });
      await driverNotification.remove(assignId);
      if (deleteBookingAssign) {
        res.status(httpStatus.OK).json({
          status: true,
          message: "Booking Assign deleted successfully.",
        });
      }
    } else {
      res.status(httpStatus.OK).json({
        status: false,
        message: "Booking assign failed.",
      });
    }
  } catch (error) {
    next(error);
  }
};
