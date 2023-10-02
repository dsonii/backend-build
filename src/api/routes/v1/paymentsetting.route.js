const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/paymentsetting.controller');
const { getAuth } = require('../../middlewares/auth');
const { offerValidation } = require('../../validations');

const router = express.Router();


router
  .route('/')
  .get(getAuth('master.admin'), controller.get)

router
  .route('/:name')


/**
     * update the single location
     * */
  .patch(getAuth('master.admin'), controller.update)

module.exports = router;
