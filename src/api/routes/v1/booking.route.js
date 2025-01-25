const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/booking.controller');
const {
  authorize,
  getAuth,
} = require('../../middlewares/auth');

const router = express.Router();


router
  .route('/search')
  .get(getAuth('booking.view', 'master.admin'), controller.list);


router
  .route('/count/:status/:start_date/:end_date')
  .get(getAuth('booking.view', 'master.admin'), controller.count);


router
  .route('/:bookingId')

  .get(getAuth('booking.edit', 'master.admin'), controller.get);


  router
  .route('/histories/:customerId')

  .get(getAuth('booking.view', 'master.admin'), controller.bookingHistories);


router
  .route('/:pnr_no')

  .post(getAuth('booking.edit', 'master.admin'), controller.cancel);

module.exports = router;
