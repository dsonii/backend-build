const express = require('express');
const controller = require('../../controllers/payment.controller');
const {
  authorize,
  getAuth,
} = require('../../middlewares/auth');

const router = express.Router();


router
  .route('/search')
  .get(getAuth('payment.view', 'master.admin'), controller.list);


router
  .route('/:paymentId')
  .get(getAuth('payment.view', 'master.admin'), controller.fetch);


router
  .route('/check/:orderId')
  .post(getAuth('payment.edit', 'master.admin'), controller.checkStatus);

router
  .route('/count/:status/:start_date/:end_date/:is_wallet')
  .get(getAuth('payment.view', 'master.admin'), controller.count);


router
  .route('/update/:paymentId')
  .post(getAuth('payment.edit', 'master.admin'), controller.updateStatus);
// router
//   .route('/:paymentId')

//   .get(getAuth('payments'), controller.get)


module.exports = router;
