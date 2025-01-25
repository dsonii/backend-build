const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');
const mongoosePaginate = require('mongoose-paginate-v2');
const paginateAggregate = require('mongoose-aggregate-paginate-v2');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require('moment-timezone');

const PaymentSchema = new Schema(
  {
    bookingId: {
      type: ObjectId,
      ref: 'Booking',
      default: null,
    },
    walletId: {
      type: ObjectId,
      ref: 'Wallet',
    },
    userId: {
      type: ObjectId,
      ref: 'User',
    },
    passId: {
      type: ObjectId,
      ref: 'Pass',
    },
    is_deleted: { type: Boolean, default: false },
    title: { type: String, default: '' },
    type: { type: Number, default: 1 }, // 0 credit 1 debit
    ferriOrderId: { type: String, default: '' },
    orderId: { type: String, required: true, index: true },
    paymentId: { type: String, default: '' },
    payment_signature: { type: String, default: '' },
    refund_type:{type:String,enum:['percentage','number','-'],default:'-'},
    refund_number:{type:String,default:''},
    amount: { type: String, default: '' },
    is_pass: { type: Boolean, default: false, index: true },
    total_pass_amount: { type: Number, default: 0 },
    payment_type: {
      type: String,
      enum: ["wallet", "trip","pass","free","refund"],
      default: "wallet",
    },
    payment_status: {
      type: String,
      enum: [
        'Pending',
        'Completed',
        'Processing',
        'Failed',
        'Refunded',
        'Cancelled',
      ],
      default: 'Pending',
      index: true,
    },
    payment_created: { type: Number, default: '' },
    payment_details: { type: Object, default: {} },
    method: { type: String, default: '' },
  },
  { timestamps: true },
);

PaymentSchema.statics = {
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  async findByBookingId(booking_id) {
    const result = await this.findOne({ bookingId: { $in: [mongoose.Types.ObjectId(booking_id)] } })
      .populate({ path: 'passId', select: 'no_of_rides' }).lean();
    const dd = result ? this.transformSingleData(result) : {};

    // console.log('dd', dd);
    return dd;
  },
  async create(data) {
    const obj = {
      bookingId: data.bookingId,
      bookingLogId: data.bookingLogId,
      walletId: data.walletId,
      userId: data.userId,
      orderId: data.orderId,
      ferriOrderId: data.ferriOrderId,
      payment_status: data.payment_status,
      method: data.method,
      amount: data.amount,
      title: data.title,
      type: data.type,
    };

    if (await this.exists({ orderId: data.orderId })) {
      return await this.findOneAndUpdate({ orderId: data.orderId }, obj, { new: true });
    }
    return await new this(obj).save();
  },
  transformSingleData(result) {
    return {
      _id: result._id,
      title: result.title,
      payment_status: result.payment_status,
      amount: result.is_pass ? result.total_pass_amount : result.amount,
      method: result.method,
      paymentId: result.paymentId,
      orderId: result.orderId,
      payment_created: this.checkPaymentCreated(result),
      is_pass: result.is_pass,
      no_of_pass_ride: result.passId ? result.passId.no_of_rides : 0,
      createdAt: moment(result.createdAt)
        .tz(DEFAULT_TIMEZONE)
        .format('DD MMM YYYY'),
    };
  },
  checkPaymentCreated(payments) {
    if (payments) {
      if (payments.payment_created) {
        return moment
          .utc(moment.unix(payments.payment_created))
          .tz(DEFAULT_TIMEZONE)
          .format('lll');
      }
      return moment(payments.createdAt)
        .tz(DEFAULT_TIMEZONE)
        .format('lll');
    }
    return '-';
  },
  formattedData(data) {
    let i = 1;
    console.log("DEFAULT_TIMEZONE",DEFAULT_TIMEZONE)
    console.log("DEFAULT_DATEFORMAT",DEFAULT_DATEFORMAT)
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: i++,
        title: item.title,
        status: item.type == 0 ? 'credit' : 'debit',
        type: item.type,
        payment_status: item.payment_status,
        method: item.method ? item.method : '-',
        amount: item.amount,
        createdAt: moment(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_DATEFORMAT),
      });
    });
    return selectableItems;
  },
  transformDataLists(data, refundSetting) {
    let i = 1;
    const selectableItems = [];
    let refund_amount = 0;

    data.forEach((item) => {
      const finalTotalFare = parseInt(item.amount);
      if (refundSetting.refunds) {
        const refundAmount = parseInt(refundSetting.refunds.amount);
        if (refundSetting.refunds.type === 'percentage') {
          refund_amount = Math.round(finalTotalFare - (finalTotalFare * refundAmount) / 100);
        } else if (refundSetting.refunds.type === 'number') {
          refund_amount = finalTotalFare - refundAmount;
        }
      }

      selectableItems.push({
        id: i++,
        bookingId: item.bookingId ? item.bookingId._id : '',
        booking_pnr: item.bookingId ? item.bookingId.pnr_no : '-',
        title: item.title,
        is_pass: item.is_pass,
        total_pass_amount: item.total_pass_amount,
        orderId: item.orderId,
        paymentId: item.paymentId,
        payment_status: item.payment_status,
        amount: finalTotalFare,
        refund_amount: item.payment_status === 'Refunded' ? refund_amount : '-',
        method: item.method,
        customer_name: `${item.userId.firstname} ${item.userId.lastname}`,
        customer_phone: item.userId.phone,
        createdAt: moment(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format('DD MMM YYYY'),
      });
    });
    return selectableItems;
  },
  formattedDefaultBookingData(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        //   id: item._id,
        title: item.title,
        busId: item.busId,
        bookingId: item.bookingId,
        routeId: item.routeId,
        pickupId: item.pickupId,
        dropoffId: item.dropoffId,
        busscheduleId: item.busscheduleId,
        status: item.type == 0 ? "credit" : "debit",
        type: item.type,
        payment_status: item.payment_status,
        method: item.method,
        amount: item.is_pass ? item.total_pass_amount : item.amount,
        is_pass: item.is_pass,
        no_of_pasess: item.passId ? item.passId.no_of_rides : 0,
        payment_created: moment(item.createdAt)
          .tz("Asia/kolkata")
          .format("DD MMM YYYY"),
        booking_details: item.bookingId
          ? this.bookingDetail(item.bookingId)
          : [],
        is_booked: true,  
      });
    });
    return selectableItems;
  },
  bookingDetail(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        //   id: item._id,
        pnr_no: item.pnr_no,
        seat_nos: _.join(item.seat_nos, ","),
        travel_status: item.travel_status,
        booking_date: moment(item.booking_date)
          .tz("Asia/Kolkata")
          .format("DD-MM-YYYY"),
        start_time: item.start_time,
        start_date: item.start_date,
        drop_date: item.drop_date,
        drop_time: item.drop_time,
        route_name: item.routeId ? item.routeId.title : "-",
        pickup_name: item.pickupId ? item.pickupId.title : "-",
        dropoff_title: item.dropoffId ? item.dropoffId.title : "-",
        bus_detail: item.busId
          ? {
              code: item.busId.code,
              name: item.busId.name,
              brand: item.busId.brand,
              model_no: item.busId.model_no,
              chassis_no: item.busId.chassis_no,
              reg_no: item.busId.reg_no,
            }
          : {},

        // title: item.title,
        // status: (item.type == 0) ? 'credit' : 'debit',
        // type: item.type,
        // payment_status: item.payment_status,
        // method: item.method,
        // amount: item.amount,
        // payment_created: moment(item.createdAt).tz('Asia/kolkata').format('DD MMM YYYY'),
      });
    });
    return selectableItems;
  },
};

PaymentSchema.plugin(mongoosePaginate);
PaymentSchema.plugin(paginateAggregate);


module.exports = mongoose.model('Payment', PaymentSchema);
