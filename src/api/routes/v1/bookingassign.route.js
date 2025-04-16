const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/bookingassign.controller');
const {
  authorize,
  getAuth,
} = require('../../middlewares/auth');

const router = express.Router();


router
  .route('/')
  .post(getAuth('booking.assigns.create', 'master.admin'), controller.create);


router
  .route('/search')
  .get(getAuth('booking.assigns.view', 'master.admin'), controller.list);

router
  .route('/:assignId')

  .get(getAuth('booking.assigns.edit', 'master.admin'), controller.get)
  .patch(getAuth('booking.assigns.edit', 'master.admin'), controller.update)

  .delete(getAuth('booking.assigns.delete', 'master.admin'), controller.remove);

module.exports = router;
