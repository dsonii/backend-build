const mongoose = require("mongoose");
const httpStatus = require("http-status");

const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require("moment-timezone");
const paginateAggregate = require("mongoose-aggregate-paginate-v2");
const Payment = require("./payment.model");

/**
 * Booking Schema
 * @private
 */
const bookingSchema = new mongoose.Schema(
  {
    busscheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus_Schedule",
      required: true,
    },
    pnr_no: { type: String, unique: true },
    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    pickupId: {
      type: ObjectId,
      ref: "Location",
      required: true,
    },
    dropoffId: {
      type: ObjectId,
      ref: "Location",
      required: true,
    },
    routeId: {
      type: ObjectId,
      ref: "Route",
      required: true,
    },
    busId: { type: ObjectId, ref: "Bus", required: true },
    offerId: {
      type: ObjectId,
      ref: "Offer",
      default: null,
    },
    seat_nos: { type: [String], default: [""] },
    is_deleted: { type: Boolean, default: false },
    travel_status: {
      type: String,
      enum: [
        "SEARCHING",
        "CANCELLED",
        "ACCEPTED",
        "ASSIGNED",
        "STARTED",
        "ARRIVED",
        "PICKEDUP",
        "DROPPED",
        "COMPLETED",
        "SCHEDULED",
        "ONBOARDED",
        "EXPIRED",
      ],
      default: "SCHEDULED",
    },
    payment_mode: { type: String, enum: ["WALLET", "UPI", "PAYTM", "CARD"] },
    distance: { type: String, default: "" },
    duration: { type: String, default: "" },
    has_return: { type: Boolean, default: false },

    start_time: { type: String, default: null },
    start_date: { type: String, default: null },
    drop_date: { type: String, default: null },
    drop_time: { type: String, default: null },
    return_routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
    },
    passengers: { type: String },
    discount: { type: String, default: "" },
    sub_total: { type: String, default: "" },
    tax: { type: String, default: "" },
    tax_amount: { type: String, default: "" },
    fee: { type: String, default: "" },
    final_total_fare: { type: String, default: "" },
    ip: { type: String, default: "0.0.0.0" },
    booking_date: { type: Date, default: null },
    bus_depature_date: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

bookingSchema.virtual("payments", {
  ref: "Payment", // the model to use
  localField: "_id", // find children where 'localField'
  foreignField: "bookingId", // is equal to foreignField
  justOne: true,
});

bookingSchema.statics = {
  async transformSingleData(item) {
    return {
      id: item._id,
      travel_status: item.travel_status,
      seat_nos: item.seat_nos.toString(),
      has_return: item.has_return,
      start_time: item.start_time,
      start_date: item.start_date,
      drop_date: item.drop_date ? item.drop_date : "",
      drop_time: item.drop_time ? item.drop_time : "",
      sub_total: item.sub_total,
      discount: item.discount ? item.discount : "",
      tax: item.tax,
      tax_amount: item.tax_amount,
      fee: item.fee,
      final_total_fare: item.final_total_fare,
      pnr_no: item.pnr_no,
      distance: item.distance,
      passengers: item.passengers,
      routeId: item.routeId._id,
      route_name: item.routeId.title,
      pickupId: item.pickupId._id,
      pickupId_title: item.pickupId.title,
      dropoffId: item.dropoffId._id,
      dropoffId_title: item.dropoffId.title,
      busId: item.busId._id,
      bus_name: item.busId.name,
      bus_model_no: item.busId.model_no,
      customer_name: `${item.userId.firstname} ${item.userId.lastname}`,
      customer_phone: item.userId.phone,
      customer_email: item.userId.email,
      customer_gender: item.userId.gender,
      userId: item.userId._id,
      payment_status: item.payments ? item.payments.payment_status : "",
      payment_created: this.checkPaymentCreated(item.payments),

      orderId: item.payments ? item.payments.orderId : "",
      // payment_id: item.payments ? item.payments.paymentId : '',
      // paymentId: item.payments ? item.payments._id : '',
      // payment_amount: item.payments ? item.payments.amount : '',
      // payment_method: item.payments ? item.payments.method : '-',
      created_at: moment(item.createdAt)
        .tz(DEFAULT_TIMEZONE)
        .format(`${DEFAULT_DATEFORMAT} ${DEFAULT_TIMEFORMAT}`),
    };
  },
  async transformData(data) {
    let selectableItems = [];
    let i = 1;
    for (let item of data) {
      const payments = await Payment.findByBookingId(item._id);

      selectableItems.push({
        id: i++,
        ids: item._id,
        travel_status: item.travel_status,
        seat_nos: item.seat_nos.toString(),
        has_return: item.has_return ? "1" : "2",
        start_time: item.start_time,
        start_date: item.start_date,
        drop_date: item.drop_date ? item.drop_date : "",
        drop_time: item.drop_time ? item.drop_time : "",
        sub_total: item.sub_total,
        discount: item.discount ? item.discount : "",
        date_time: `${moment
          .utc(item.booking_date)
          .tz(DEFAULT_TIMEZONE)
          .format("YYYY-MM-DD")} <br/> <small>${item.start_time} - ${
          item.drop_time
        }</small>`,
        tax: item.tax,
        tax_amount: item.tax_amount,
        fee: item.fee,
        final_total_fare: item.final_total_fare,
        pnr_no: item.pnr_no,
        distance: item.distance,
        passengers: item.passengers,
        routeId: item.routeId._id,
        route_name: item.routeId.title,
        pickupId: item.pickupId._id,
        stopping_points: `${item.pickupId.title} - ${item.dropoffId.title}<br/> from <small><b>${item.routeId.title}</b></small>`,
        dropoffId: item.dropoffId._id,
        busId: item.busId._id,
        bus_name: item.busId.name,
        bus_model_no: item.busId.model_no,
        customer: `${item.userId.firstname} ${item.userId.lastname} <br/> <small>${item.userId.email}</small>`,
        customer_name: `${item.userId.firstname} ${item.userId.lastname}`,
        customer_phone: item.userId.phone,
        customer_email: item.userId.email,
        customer_gender: item.userId.gender,
        userId: item.userId._id,
        payment_status: payments ? payments.payment_status : "",
        payment_created: payments ? payments.payment_created : "",
        orderId: payments ? payments.orderId : "",
        is_pass: payments && payments.is_pass ? "YES" : "NO",
        no_of_pass: payments ? payments.no_of_pass_ride : 0,
        payment_id: payments ? payments.paymentId : "",
        paymentId: payments ? payments._id : "",
        payment_amount: payments ? payments.amount : "",
        payment_method: payments ? payments.method : "-",
        created_at: moment(item.createdAt).tz(DEFAULT_TIMEZONE).format("LLL"),
      });
    }
    return selectableItems;
  },
  checkPaymentCreated(payments) {
    if (payments) {
      if (payments.payment_created) {
        return moment
          .utc(moment.unix(payments.payment_created))
          .tz(DEFAULT_TIMEZONE)
          .format("lll");
      }
      return moment(payments.createdAt).tz(DEFAULT_TIMEZONE).format("lll");
    }
    return "-";
  },
};

bookingSchema.plugin(paginateAggregate);

module.exports = mongoose.model("Booking", bookingSchema);
