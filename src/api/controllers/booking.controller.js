const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Booking = require("../models/booking.model");
const User = require("../models/user.model");
const Payment = require("../models/payment.model");
const Currency = require("../models/currency.model");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const { bookingChart } = require("../services/dashboardService");
const {
  bookingWithRefund,
  bookingWithoutRefund,
} = require("../services/bookingService");
/**
 * count payment
 * @returns
 */
exports.count = async (req, res, next) => {
  try {
    const payment_status = req.params.status.toUpperCase();
    const TODAY = req.params.start_date; // moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const YEAR_BEFORE = req.params.end_date; // moment().subtract(1, 'years').format("YYYY-MM-DD");

    let condition = {};
    condition = {
      travel_status: payment_status,
      booking_date: { $gte: new Date(YEAR_BEFORE), $lte: new Date(TODAY) },
    };

    const result = await bookingChart(TODAY, YEAR_BEFORE, condition);
    res.status(httpStatus.OK);
    res.json({
      message: "booking count fetched successfully.",
      years_data: result.length > 0 ? result[0].years_data : [],
      data: result.length ? result[0].data : [],
      status: true,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

/**
 * Get booking
 * @public
 */
exports.get = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate({ path: "pickupId", select: "_id title location" })
      .populate({ path: "dropoffId", select: "_id title location" })
      .populate({ path: "routeId", select: "_id title" })
      .populate({ path: "busId", select: "_id name reg_no model_no" })
      .populate({
        path: "userId",
        select: "_id firstname lastname phone email gender ",
      });
    // .populate({
    //   path: 'payments',
    //   select: '_id orderId payment_status is_pass payment_created createdAt method amount ferriOrderId paymentId passId',
    //   populate: { path: 'passId', select: '_id no_of_rides' },
    // });
    const formatedData = await Booking.transformSingleData(booking);
    const paymentDetail = await Payment.findOne({
      bookingId: { $in: [mongoose.Types.ObjectId(formatedData.id)] },
    }).populate({ path: "passId", select: "no_of_rides" });
    formatedData.payment_detail = await Payment.transformSingleData(
      paymentDetail
    );
    formatedData.default_currency = await Currency.defaultPaymentCurrency();
    formatedData.payment_detail.default_currency =
      formatedData.default_currency;
    // console.log('formatedData', formatedData);
    res.status(httpStatus.OK);
    res.json({
      message: "booking fetched successfully.",
      data: formatedData,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get booking layout list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $or: [
            {
              fullname: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              email: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              phone: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
          ],
          is_deleted: false,
        }
      : {
          travel_status: req.query.travel_status,
          is_deleted: false,
        };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortType != "") {
      sort = { [req.query.sortBy]: req.query.sortType == "asc" ? 1 : -1 };
    } else {
      sort = { createdAt: -1 };
    }
    let filters = {};
    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);

      if (filtersData.type === "select") {
        console.log("name", filtersData.name, filtersData.selected_options[0]);
        filters = {
          travel_status: req.query.travel_status,
          is_deleted: false,
        };
      } else if (filtersData.type === "date") {
        const today = moment(filtersData.value.startDate);
        filters = {
          booking_date: {
            $gte: today.toDate(),
            $lte: today.endOf("day").toDate(),
          },
          travel_status: req.query.travel_status,
          is_deleted: false,
        };
      }
    }

    const aggregateQuery = Booking.aggregate([
      {
        $match: { is_deleted: false },
      },
      {
        $lookup: {
          from: "locations",
          localField: "pickupId",
          foreignField: "_id",
          as: "pickup_location",
        },
      },
      {
        $unwind: {
          path: "$pickup_location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "dropoffId",
          foreignField: "_id",
          as: "drop_location",
        },
      },
      {
        $unwind: {
          path: "$drop_location",
          preserveNullAndEmptyArrays: true,
        },
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
          from: "bus_types",
          localField: "bus.bustypeId",
          foreignField: "_id",
          as: "bus_type",
        },
      },
      {
        $unwind: "$bus_type",
      },
      {
        $lookup: {
          from: "bus_layouts",
          localField: "bus.buslayoutId",
          foreignField: "_id",
          as: "bus_layout",
        },
      },
      {
        $unwind: "$bus_layout",
      },
      {
        $lookup: {
          from: "passengers",
          // localField: "_id",
          // foreignField: "bookingId",
          let: { booking_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$bookingId", "$$booking_id"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                fullname: 1,
                age: 1,
                gender: 1,
                seat: 1,
              },
            },
          ],
          as: "passengers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "payments",
          // localField: "_id",
          // foreignField: "bookingId",
          let: { booking_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$$booking_id", { $ifNull: ["$bookingId", []] }],
                },
                payment_type: { $in: ["trip", "pass"] },
              },
            },
            {
              $lookup: {
                from: "passes",
                let: { passId: "$passId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$passId"] } } },
                ],
                as: "pass",
              },
            },
            {
              $unwind: {
                path: "$pass",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                amount: 1,
                method: 1,
                payment_status: 1,
                payment_created_date: {
                  $toDate: {
                    $multiply: ["$payment_created", 1000], // Convert seconds to milliseconds
                  },
                },
                orderId: 1,
                no_of_pass_ride: { $ifNull: ["$pass.no_of_rides", "0"] },
              },
            },
          ],
          as: "payment",
        },
      },
      {
        $unwind: "$payment",
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          travel_status: 1,
          seat_nos: 1,
          has_return: {
            $cond: {
              if: { $eq: ["$has_return", true] },
              then: "1",
              else: "2",
            },
          },
          start_time: 1,
          start_date: 1,
          drop_date: { $ifNull: ["$drop_date", ""] },
          drop_time: { $ifNull: ["$drop_time", ""] },
          sub_total: 1,
          discount: { $ifNull: ["$discount", ""] },
          booking_date: 1,
          date_time: "",
          tax: 1,
          tax_amount: 1,
          fee: 1,
          final_total_fare: 1,
          pnr_no: 1,
          distance: 1,
          passengers: { $ifNull: [{ $size: "$passengers" }, 0] },
          routeId: { $ifNull: ["$route._id", ""] },
          route_name: { $ifNull: ["$route.title", ""] },
          // pickupId: 1,
          pickup_location_title: { $ifNull: ["$pickup_location.title", "-"] },
          //stopping_points: `${item.pickupId.title} - ${item.dropoffId.title}<br/> from <small><b>${item.routeId.title}</b></small>`,
          //  dropoffId: 1,
          drop_location_title: { $ifNull: ["$drop_location.title", "-"] },
          //busId: { $ifNull: ["$bus._id", ""] },
          location: {
            route_name: { $ifNull: ["$route.title", ""] },
            drop_location: { $ifNull: ["$drop_location.title", "-"] },
            pickup_location: { $ifNull: ["$pickup_location.title", "-"] },
          },
          bus_name: { $ifNull: ["$bus.name", ""] },
          bus_model_no: { $ifNull: ["$bus.model_no", ""] },
          bus_reg_no: { $ifNull: ["$bus.reg_no", ""] },
          bus_type_name: { $ifNull: ["$bus_type.name", ""] },
          bus_layout_name: { $ifNull: ["$bus_layout.name", ""] },
          bus_layout_layout: { $ifNull: ["$bus_layout.layout", ""] },
          customer_name: {
            $ifNull: [{ $concat: ["$user.firstname", "$user.lastname"] }, ""],
          },
          customer_phone: { $ifNull: ["$user.phone", ""] },
          customer_email: { $ifNull: ["$user.email", ""] },
          customer_gender: { $ifNull: ["$user.gender", ""] },
          userId: { $ifNull: ["$user._id", ""] },
          payment_status: { $ifNull: ["$payment.payment_status", ""] },
          payment_created: {
            $ifNull: [
              {
                $toDate: { $multiply: ["$payment.payment_created", 1000] },
              },
              "",
            ],
          },
          orderId: { $ifNull: ["$payment.orderId", ""] },
          is_pass: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$is_pass", true] },
                  then: "Yes",
                  else: "NO",
                },
              },
              "",
            ],
          },
          no_of_pass: { $ifNull: ["$payment.no_of_pass_ride", ""] },
          paymentId: { $ifNull: ["$payment._id", ""] },
          payment_amount: { $ifNull: ["$payment.amount", ""] },
          payment_method: { $ifNull: ["$payment.method", "-"] },
          payment_details: { $ifNull: ["$payment", {}] },
          passenger_details: { $ifNull: ["$passengers", []] },
          // status: {
          //   $cond: {
          //     if: { $eq: ["$status", 0] },
          //     then: "Active",
          //     else: "InActive",
          //   },
          // },
          createdAt: 1,
          is_deleted: 1,
        },
      },
      {
        $match: condition,
      },
      {
        $match: filters,
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "bookings",
      },
      sort,
    };

    const result = await Booking.aggregatePaginate(aggregateQuery, options);

    res.json({ data: result });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get customer booking histories list
 * @public
 */
exports.bookingHistories = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    let condition = req.query.global_search
      ? {
          $or: [
            {
              bus_name: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              route_name: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              pnr_no: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              bus_model_no: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              orderId: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              paymentId: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
          ],
          is_deleted: false,
          travel_status: req.query.travel_status,
          //  userId:mongoose.Types.ObjectId(customerId)
        }
      : {
          travel_status: req.query.travel_status,
          is_deleted: false,
          // userId:mongoose.Types.ObjectId(customerId)
        };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortType != "") {
      sort = { [req.query.sortBy]: req.query.sortType == "asc" ? 1 : -1 };
    } else {
      sort = { createdAt: -1 };
    }
    let filters = {};
    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);

      if (filtersData.type === "select") {
        console.log("name", filtersData.name, filtersData.selected_options[0]);
        filters = {
          travel_status: req.query.travel_status,
          is_deleted: false,
        };
      } else if (filtersData.type === "date") {
        const today = moment(filtersData.value.startDate);
        filters = {
          booking_date: {
            $gte: today.toDate(),
            $lte: today.endOf("day").toDate(),
          },
          travel_status: req.query.travel_status,
          is_deleted: false,
        };
      }
    }

    const aggregateQuery = Booking.aggregate([
      {
        $match: {
          is_deleted: false,
          userId: mongoose.Types.ObjectId(customerId),
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "pickupId",
          foreignField: "_id",
          as: "pickup_location",
        },
      },
      {
        $unwind: {
          path: "$pickup_location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "dropoffId",
          foreignField: "_id",
          as: "drop_location",
        },
      },
      {
        $unwind: {
          path: "$drop_location",
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: "$route",
          preserveNullAndEmptyArrays: true,
        },
      },
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
          from: "bus_types",
          localField: "bus.bustypeId",
          foreignField: "_id",
          as: "bus_type",
        },
      },
      {
        $unwind: "$bus_type",
      },
      {
        $lookup: {
          from: "bus_layouts",
          localField: "bus.buslayoutId",
          foreignField: "_id",
          as: "bus_layout",
        },
      },
      {
        $unwind: "$bus_layout",
      },
      {
        $lookup: {
          from: "passengers",
          // localField: "_id",
          // foreignField: "bookingId",
          let: { booking_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$bookingId", "$$booking_id"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                fullname: 1,
                age: 1,
                gender: 1,
                seat: 1,
              },
            },
          ],
          as: "passengers",
        },
      },

      {
        $lookup: {
          from: "payments",
          // localField: "_id",
          // foreignField: "bookingId",
          let: { booking_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$$booking_id", { $ifNull: ["$bookingId", []] }],
                },
                payment_type: { $in: ["trip", "pass"] },
              },
            },
            {
              $lookup: {
                from: "passes",
                let: { passId: "$passId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$passId"] } } },
                ],
                as: "pass",
              },
            },
            {
              $unwind: {
                path: "$pass",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                amount: 1,
                method: 1,
                payment_status: 1,
                payment_created_date: {
                  $toDate: {
                    $multiply: ["$payment_created", 1000], // Convert seconds to milliseconds
                  },
                },
                orderId: 1,
                currency_code: 1,
                no_of_pass_ride: { $ifNull: ["$pass.no_of_rides", "0"] },
              },
            },
          ],
          as: "payment",
        },
      },
      {
        $unwind: {
          path: "$payment",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          travel_status: 1,
          seat_nos: 1,
          has_return: {
            $cond: {
              if: { $eq: ["$has_return", true] },
              then: "1",
              else: "2",
            },
          },
          start_time: 1,
          start_date: 1,
          drop_date: { $ifNull: ["$drop_date", ""] },
          drop_time: { $ifNull: ["$drop_time", ""] },
          sub_total: 1,
          discount: { $ifNull: ["$discount", ""] },
          booking_date: 1,
          date_time: "",
          tax: 1,
          tax_amount: 1,
          fee: 1,
          final_total_fare: {
            $concat: [DEFAULT_CURRENCY, "", "$final_total_fare"],
          },
          pnr_no: 1,
          distance: 1,
          passengers: { $ifNull: [{ $size: "$passengers" }, 0] },
          routeId: { $ifNull: ["$route._id", ""] },
          route_name: { $ifNull: ["$route.title", ""] },
          location: {
            route_name: { $ifNull: ["$route.title", ""] },
            drop_location: { $ifNull: ["$drop_location.title", "-"] },
            pickup_location: { $ifNull: ["$pickup_location.title", "-"] },
          },
          //   pickupId: 1,

          //stopping_points: `${item.pickupId.title} - ${item.dropoffId.title}<br/> from <small><b>${item.routeId.title}</b></small>`,
          //   dropoffId: 1,

          //    busId: { $ifNull: ["$bus._id", ""] },
          bus_name: { $ifNull: ["$bus.name", ""] },
          bus_model_no: { $ifNull: ["$bus.model_no", ""] },
          bus_reg_no: { $ifNull: ["$bus.reg_no", ""] },
          bus_type_name: { $ifNull: ["$bus_type.name", ""] },
          bus_layout_name: { $ifNull: ["$bus_layout.name", ""] },
          bus_layout_layout: { $ifNull: ["$bus_layout.layout", ""] },
          payment_status: { $ifNull: ["$payment.payment_status", ""] },
          payment_created: {
            $ifNull: [
              {
                $toDate: { $multiply: ["$payment.payment_created", 1000] },
              },
              "",
            ],
          },
          orderId: { $ifNull: ["$payment.orderId", ""] },
          is_pass: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$is_pass", true] },
                  then: "Yes",
                  else: "NO",
                },
              },
              "",
            ],
          },
          no_of_pass: { $ifNull: ["$payment.no_of_pass_ride", ""] },
          payment_details: { $ifNull: ["$payment", {}] },
          passenger_details: { $ifNull: ["$passengers", []] },
          // status: {
          //   $cond: {
          //     if: { $eq: ["$status", 0] },
          //     then: "Active",
          //     else: "InActive",
          //   },
          // },
          createdAt: 1,
          is_deleted: 1,
        },
      },
      {
        $match: condition,
      },
      {
        $match: filters,
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "bookinghistories",
      },
      sort,
    };

    const result = await Booking.aggregatePaginate(aggregateQuery, options);
    const customer_details = await User.findById(customerId).select("firstname lastname country_code phone ").lean();
    result.customer_details = customer_details;
    res.json({ data: result });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get booking Cancel list
 * @public
 */
exports.cancel = async (req, res, next) => {
  const { is_refund } = req.body;
  const { pnr_no } = req.params;
  const session = await mongoose.startSession();
  try {
    // Start session
    await session.startTransaction();

    if (is_refund) {
      // /is refund
      const result = await bookingWithRefund(pnr_no);
      if (!result) {
        res.status(httpStatus.NotFound);
        res.json({
          message: "No booking pnr no found.",
          status: false,
        });
      }
    } else {
      const result = await bookingWithoutRefund(pnr_no);
      if (!result) {
        res.status(httpStatus.NotFound);
        res.json({
          message: "No booking pnr no found.",
          status: false,
        });
      }
    }
    // finish transcation
    await session.commitTransaction();
    session.endSession();

    res.status(httpStatus.OK);
    res.json({
      message: "booking cancelled successfully.",
      status: true,
    });
  } catch (error) {
    console.log(err);
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    next(error);
  }
};
