
const httpStatus = require("http-status");
const { omit } = require("lodash");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const Booking = require("../models/booking.model");
const Payment = require("../models/payment.model");
const Passenger = require("../models/passenger.model");
const Ticket = require("../models/ticket.model");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const HelperCustom = require('../helpers/custom');
const { nanoid } = require("nanoid");
/**
  /**
   *
   * @param  {string}  base64 Data
   * @return {string}  Image url
   */
  module.exports = {
    defaultBookingHistory: async (userId, bookingId) => {
      try {
        const getpayments = await Payment.find({
          bookingId: { $in: bookingId},
          userId,
          payment_status: { $in: ["Processing"] },
        }).populate({
          path: "bookingId",
          populate: [
            { path: "offerId" },
            {
              path: "busId",
              select: "code name brand model_no chassis_no reg_no",
            },
            { path: "routeId", select: "title" },
            { path: "pickupId", select: "title location" },
            { path: "dropoffId", select: "title location" },
            { path: "busscheduleId", select: "title" },
          ],
        })
        .populate({ path: "passId" })
        .lean();
         return getpayments;
        //return Payment.formattedDefaultBookingData(getpayments);
      } catch (err) {
        return "err while :" + err;
      }
    },
    saveBookings: async (req, res, savedUser, savedWallet, isReturnCheck) => {
        // const session = await mongoose.startSession();
        let {
              busScheduleId,
              route,
              bus,
              pickup_location,
              drop_location,
              has_return,
              seat,
              return_busScheduleId,
              return_route,
              return_bus,
              return_seat,
            } = req.body;
            let fareData = "";
            let bookedBy = '';
            if (typeof req.body.bookedBy != 'undefined') {
              if (req.body.bookedBy != "") {
                  bookedBy = 'admin';
              }
            }

        if (busScheduleId && route && bus)    {
          const currentDate = moment().format("YYYY-MM-DD");
          const datetime = new Date();
          let current_date = moment(datetime).toDate();
          let userId = savedUser._id;
          let walletId = savedWallet._id;
          let offer_code = "";
          
          if (isReturnCheck) {
            busScheduleId = return_busScheduleId;
            route = return_route;
            bus = return_bus;
            seat = return_seat;
            fareData = await HelperCustom.generateBookingFare(busScheduleId,route, bus, drop_location[0].location.id, pickup_location[0].location.id, "["+seat+"]",has_return,current_date); // helper generate fare
        } else {
            fareData = await HelperCustom.generateBookingFare(busScheduleId,route, bus, pickup_location[0].location.id, drop_location[0].location.id, "["+seat+"]",has_return,current_date); // helper generate fare
        }
          
        const passengerDetailsItem = [{
                                fullname: savedUser.firstname+ ' ' +savedUser.lastname,
                                age: savedUser.age,
                                gender: savedUser.gender,
                                seat: seat
                            }];
          
          // Start session
        //   await session.startTransaction();
          const seats = fareData.seat_no.replace(/\[|\]/g, "").split(","); // convert string to Array
          const passengers = seats.length;
          const walletBalance = await Wallet.findById(walletId);
          var saveObj = {};
          var offer_id = null;
          var attempt = 0;
          var offer_discount_amount = 0;
          saveObj = {
            busscheduleId: fareData.busschedule_id,
            pnr_no: fareData.pnr_no,
            routeId: fareData.route_id,
            pickupId: fareData.pickup_stop_id,
            dropoffId: fareData.drop_stop_id,
            busId: fareData.bus_id,
            offerId: null,
            userId,
            seat_nos: seats,
            distance: fareData.distance,
            has_return: fareData.has_return === "1" ? false : true,
            start_time: fareData.pickup_time,
            start_date: fareData.created_date,
            drop_time: fareData.drop_time,
            drop_date: fareData.created_date,
            passengers,
            sub_total: fareData.sub_total,
            final_total_fare: fareData.final_total_fare,
            discount: "0",
            tax_amount: fareData.tax_amount,
            tax: fareData.tax,
            fee: fareData.fee,
            ip: req.ip,
            travel_status: "PROCESSING",
            booking_date: new Date(current_date),
            bus_depature_date: new Date(
              moment(current_date)
                .tz("Asia/Kolkata")
                .format("YYYY-MM-DD")
            ),
            bookedBy:bookedBy,
          };
    
          if (
            !(await Booking.exists({
              pnr_no: fareData.pnr_no,
            }))
          ) {
            // const seat_count
            const getticket = await Ticket.fetch(fareData.bus_id);
            saveObj.ticketId = getticket ? getticket._id : null;
            const getbookingData = await new Booking(saveObj).save();
            if (getbookingData) {
              const bookingId = getbookingData._id;
              const getBooking = await Booking.findOne({
                pnr_no: fareData.pnr_no,
              })
                .populate({
                  path: "routeId",
                  select: "title",
                })
                .populate({
                  path: "pickupId",
                  select: "title",
                })
                .populate({
                  path: "dropoffId",
                  select: "title",
                })
                .populate({
                  path: "busId",
                  select: "name model_no",
                })
                .lean();
    
              const passenger = await Passenger.passengerFormatData(
                bookingId,
                fareData.bus_id,
                userId,
                passengerDetailsItem
              );

              const persistedPassenger = await Passenger.insertMany(passenger);
              const receipt = "FER_" + nanoid(15);
              const orderIdG = "order_" + nanoid(10);
              const createPayment = {
                bookingId: getBooking._id,
                walletId: walletId,
                userId: userId,
                orderId: orderIdG,
                ferriOrderId: receipt,
                payment_status: "Processing",
                amount: fareData.final_total_fare,
                method: "",
                title: "Ride paid",
                type: 1,
              };
              const getpayment = await Payment.create(createPayment);
              // finish transcation
            //   await session.commitTransaction();
            //   session.endSession();
              return getBooking
            } else {
              return false;
            }
          } else {
            await Booking.updateOne(
              { pnr_no: fareData.pnr_no },
              { offerId: null, discount: "0" }
            );
            const getBooking = await Booking.findOne({
              pnr_no: fareData.pnr_no,
            })
              .populate({
                path: "routeId",
                select: "title",
              })
              .populate({
                path: "pickupId",
                select: "title",
              })
              .populate({
                path: "dropoffId",
                select: "title",
              })
              .populate({
                path: "busId",
                select: "name model_no",
              })
              .lean();
    
            const getPassenger = await Passenger.find({
              bookingId: getBooking._id,
            }).lean();
            return getBooking;
          }
        } else {
          return false
        }
    }
  };
  