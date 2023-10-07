const httpStatus = require('http-status');
const { omit, isEmpty } = require('lodash');
const Booking = require('../models/booking.model');
const Payment = require('../models/payment.model');
const User = require('../models/user.model');
const Admin = require('../models/admin.model');
const Driver = require('../models/driver.model');
const HelpSupport = require('../models/helper.model');
const moment = require('moment');

exports.countDown = async (req, res, next) => {
  try {
    const getcustomer = await User.countDocuments({ is_deleted: false });
    const getdriver = await Driver.countDocuments({ is_deleted: false });
   // const getagent = await Admin.countDocuments({ role: 'agents', isAdmin: false });
    const getHelpSupport = await HelpSupport.countDocuments({});
    const totalBooking = await Booking.countDocuments({ travel_status: 'COMPLETED' });

    const startDay = moment().tz(DEFAULT_TIMEZONE).startOf('day');
    const endDay = moment().tz(DEFAULT_TIMEZONE).endOf('day');
    const todayCompletedBooking = await Booking.countDocuments({ travel_status: 'COMPLETED', booking_date: { $gte: startDay, $lte: endDay } });
    const todayScheduledBooking = await Booking.countDocuments({ travel_status: 'SCHEDULED', booking_date: { $gte: startDay, $lte: endDay } });
    const todayBooking = await Booking.countDocuments({ travel_status: 'COMPLETED', booking_date: { $gte: startDay, $lte: endDay } });


    res.json({
      status: true,
      data: {
        countCustomer: {
          startVal: 3000,
          endVal: getcustomer,
          duration: 10000,
        },
        countDriver: {
          startVal: 0,
          endVal: getdriver,
          duration: 5000,
        },
        // countAgent: {
        //   startVal: 0,
        //   endVal: getagent,
        //   duration: 4000,
        // },
        countHelp: {
          startVal: 2000,
          endVal: getHelpSupport,
          duration: 4000,
        },
		    countTotalBooking: {
          startVal: 800,
          endVal: totalBooking,
          duration: 8000,
        },
        countTodayBooking: {
          startVal: 0,
          endVal: todayBooking,
          duration: 5000,
        },
        todayCompletedBooking: {
          startVal: 500,
          endVal: todayCompletedBooking,
          duration: 5000,
        },
        todayScheduledBooking: {
          startVal: 0,
          endVal: todayScheduledBooking,
          duration: 6000,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
