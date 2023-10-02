const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Booking = require("../models/booking.model");
const User = require("../models/user.model");
const Payment = require("../models/payment.model");
const Setting = require("../models/setting.model");
const { settingRazorPay } = require("../utils/setting");
const APIError = require("../utils/APIError");
const { user } = require("../notifications");
const { paymentChart } = require("../services/dashboardService");

exports.checkStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentId } = req.body;
    const razorPay = await settingRazorPay();
    const fetchPayments = await razorPay.razor.orders.fetchPayments(orderId);
    if (fetchPayments && fetchPayments.count === 0) {
      throw new APIError({
        status: 200,
        message: "payment not found.",
      });
    } else {
      const payment = fetchPayments.items.find((item, index) =>
        (item.status === "captured" && item.captured == true ? item : {})
      );
      if (payment) {
        const updatePayment = await Payment.findByIdAndUpdate(paymentId, {
          payment_status: "Completed",
          payment_created: payment.created_at,
          paymentId: payment.id,
        });

        if (
          updatePayment.bookingId != null &&
          updatePayment.bookingId.length > 0
        ) {
          const getbooking = await Booking.findOneAndUpdate(
            { _id: { $in: updatePayment.bookingId } },
            { travel_status: "SCHEDULED" }
          )
            .populate({ path: "userId", select: "device_token device_type" })
            .exec();

          if (getbooking) {
            await user.UserNotification(
              "Booking payment",
              `Booking pnr no: ${getbooking.pnr_no} payment Successfully`,
              "",
              getbooking.userId.device_token,
              getbooking.userId.device_type
            );
          }
        } else {
          const getUser = await User.findById(updatePayment.userId)
            .select("device_token device_type")
            .lean();
          if (getUser) {
            await user.UserNotification(
              "wallet recharge",
              "Wallet recharge payment Successfully",
              "",
              getUser.device_token,
              getUser.device_type
            );
          }
        }
        res.json({
          message: "payment status checked and updated.",
          status: true,
        });
      }
    }
  } catch (err) {
    return next({
      status: err.status ? err.status : err.statusCode,
      message: err.error ? err.error.description : err.message,
    });
  }
};

/**
 * count payment
 * @returns
 */
exports.count = async (req, res, next) => {
  try {
    const payment_status = req.params.status;
    const TODAY = req.params.start_date;
    const YEAR_BEFORE = req.params.end_date;

    let condition = {};
    if (payment_status === "Refunded") {
      condition = {
        payment_status,
        createdAt: { $gte: new Date(YEAR_BEFORE), $lte: new Date(TODAY) },
      };
    }
    if (payment_status === "Completed" && req.params.is_wallet === "1") {
      condition = {
        payment_status,
        title: "Wallet recharge",
        createdAt: { $gte: new Date(YEAR_BEFORE), $lte: new Date(TODAY) },
        // $and: [{ bookingId: { $exists: false } }, { bookingId: null }],
      };
    } else if (payment_status === "Completed") {
      condition = {
        payment_status,
        createdAt: { $gte: new Date(YEAR_BEFORE), $lte: new Date(TODAY) },
        bookingId: { $exists: true, $ne: [] },
        title: "Ride paid",
      };
    }

    const result = await paymentChart(TODAY, YEAR_BEFORE, condition);
    res.status(httpStatus.OK);
    res.json({
      message: "payment count fetched successfully.",
      years_data: result[0].years_data,
      data: result[0].data,
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
exports.fetch = async (req, res) => {
  try {
    res.status(httpStatus.OK);
    res.json({
      message: "payment fetched successfully.",
      data: Payment.transformSingleData(req.param.paymentId),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get booking
 * @public
 */
exports.get = async (req, res) => {
  try {
    res.status(httpStatus.OK);
    res.json({
      message: "payment fetched successfully.",
      data: Payment.transformSingleData(booking),
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
    const payment_status = Payment.capitalizeFirstLetter(req.query.filters); // refunded | Completed
    const condition = req.query.global_search
      ? {
          $or: [
            {
              customer_name: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              customer_phone: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              booking_pnr: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
          ],
          payment_status,
        }
      : {
          payment_status,
        };
    let sort = {};
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = { [data.name]: data.order != "none" ? data.order : "asc" };
    }

    let filters = {};
    // if (req.query.filters) {
    //   const filtersData = JSON.parse(req.query.filters);

    //   if (filtersData.type === "select") {
    //     console.log("name", filtersData.name, filtersData.selected_options[0]);
    //     filters = {
    //       travel_status: req.query.travel_status,
    //       is_deleted: false,
    //     };
    //   } else if (filtersData.type === "date") {
    //     const today = moment(filtersData.value.startDate);
    //     filters = {
    //       booking_date: {
    //         $gte: today.toDate(),
    //         $lte: today.endOf("day").toDate(),
    //       },
    //       travel_status: req.query.travel_status,
    //       is_deleted: false,
    //     };
    //   }
    // }

    const aggregateQuery = Payment.aggregate([
      {
        $match: { is_deleted: false },
      },
      {
        $lookup: {
          from: "bookings",
          localField: "bookingId",
          foreignField: "_id",
          as: "booking",
        },
      },
      {
        $unwind: "$booking",
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
        $project: {
          _id:0,
          id:"$_id",
         booking_pnr: { $ifNull: ["$booking.pnr_no", ""] },
          title: 1,
          is_pass: 1,
          total_pass_amount: 1,
          amount: 1,
          orderId: 1,
          paymentId: 1,
          payment_status: 1,
          method: 1,
          customer_name: {
            $ifNull: [
              { $concat: ["$user.firstname", "", "$user.lastname"] },
              "-",
            ],
          },
          customer_phone: { $ifNull: ["$user.phone", "-"] },
          createdAt: 1,
          refund_type:{$ifNull:["$refund_type",""]},
          refund_number:{$ifNull:["$refund_number",""]},
        },
      },
      {
        $addFields:{
          
          refund_amount: {
            $cond: [
              {
                $regexMatch: {
                  input: "$payment_status",
                  regex: /^(Refunded):\/\//,
                },
              },
              "$amount",
              `-`,
            ],
          },
        }
      },
      {
        $match: condition,
      },
      {
        $match: filters,
      },
    ]);

    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "payments",
      },
      sort
      // populate: [
      //   { path: 'bookingId', select: '_id pnr_no discount' },
      //   { path: 'userId', select: '_id firstname lastname  phone email gender ' },
      //   { path: 'payments', select: '_id orderId payment_status payment_created amount ferriOrderId paymentId' },

      // ],
      // lean: true,
    };
    const result = await Payment.aggregatePaginate(
      aggregateQuery,
      paginationoptions
    );
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { payment_status, payment_id, payment_created } = req.body;
    const updatePayment = await Payment.findByIdAndUpdate(paymentId, {
      payment_status,
      payment_created,
      paymentId: payment_id,
    });
    if (updatePayment) {
      await Booking.findOneAndUpdate(
        { _id: { $in: updatePayment.bookingId } },
        { travel_status: "SCHEDULED" }
      );
    }
    res.json({
      message: "payment updated successfully.",
      status: true,
    });
  } catch (err) {
    return next(err);
  }
};
