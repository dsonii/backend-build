const Booking = require('../models/booking.model');
const Wallet = require('../models/wallet.model');
const Payment = require('../models/payment.model');
const Currency = require('../models/currency.model');
const Setting = require('../models/setting.model');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const bookingWithoutRefund = async (pnr_no) => {
  try {
    const getBooking = await Booking.findOne({ pnr_no });
    if (getBooking) {
      const result = await Booking.updateOne({ pnr_no }, { travel_status: 'CANCELLED' });
      if (result.n > 0) {
        return true;
      }
    }
    return false;
  } catch (err) {
    throw err;
  }
};


const bookingWithRefund = async (pnr_no) => {
  try {
    const getBooking = await Booking.findOne({ pnr_no })
      .populate({ path: 'userId' })
      .populate({
        path: 'payments',
      }).lean();
    if (getBooking) {
      const getWallet = await Wallet.findOne({ users: getBooking.userId });
      const walletId = getWallet._id;
      const refundssettings = await Setting.getrefunds();
      if (refundssettings.refunds) {
        const refundAmount = parseInt(refundssettings.refunds.amount); // refunds amount
        const finalTotalFare = parseInt(getBooking.final_total_fare); // final total fare
        let finalRefundAmount = 0;
        if (refundssettings.refunds.type === 'percentage') {
          finalRefundAmount = Math.round(finalTotalFare - (finalTotalFare * refundAmount) / 100);
          const createPayment = {
            bookingId: getBooking._id,
            walletId,
            userId: getBooking.userId,
            orderId: `order_${nanoid(10)}`,
            ferriOrderId: `FER_${nanoid(15)}`,
            payment_status: 'Refunded',
            method: 'wallet',
            amount: finalRefundAmount,
            title: 'Trip Payment refund.',
            type: 0,
          };

          await Payment.create(createPayment);
          let total = 0;
          total = parseInt(getWallet.amount) + parseInt(finalRefundAmount);
          const updatedWallet = await Wallet.findOneAndUpdate(
            {
              _id: walletId,
            },
            {
              amount: total,
            },
          );
          if (updatedWallet) {
            await Booking.updateOne(
              {
                _id: getBooking._id,
              },
              {
                travel_status: 'CANCELLED',
              },
            );

            if (!getBooking.payments.is_pass) {
              await Payment.updateOne(
                {
                  _id: getBooking.payments._id,
                },
                {
                  payment_status: 'Cancelled',
                },
              );
            }
          }
          return true;
        } else if (refundssettings.refunds.type === 'number') {
          finalRefundAmount = finalTotalFare - refundAmount;
          const createPayment = {
            bookingId: getBooking._id,
            walletId,
            userId: getBooking.userId,
            orderId: `order_${nanoid(10)}`,
            ferriOrderId: `FER_${nanoid(15)}`,
            payment_status: 'Completed',
            method: 'wallet',
            amount: finalRefundAmount,
            title: 'Trip Payment refund.',
            type: 0,
          };

          await Payment.create(createPayment);
          const wallet = await Wallet.findOne({
            _id: walletId,
          });
          let total = 0;
          total = parseInt(wallet.amount) + parseInt(finalRefundAmount);
          const updatedWallet = await Wallet.findOneAndUpdate(
            {
              _id: walletId,
            },
            {
              amount: total,
            },
          );
          if (updatedWallet) {
            await Booking.updateOne(
              {
                _id: getBooking._id,
              },
              {
                travel_status: 'CANCELLED',
              },
            );

            if (!getBooking.payments.is_pass) {
              await Payment.updateOne(
                {
                  _id: getBooking.payments._id,
                },
                {
                  payment_status: 'Cancelled',
                },
              );
            }
          }
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    throw err;
  }
};


module.exports = {
  bookingWithoutRefund,
  bookingWithRefund,

};
