const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/country.controller');
const { getAuth } = require('../../middlewares/auth');
const { countryValidation } = require('../../validations');


const router = express.Router();



router
  .route('/')
  .post(getAuth('master.admin'), Validate(countryValidation.create), controller.create)
  .get(controller.load);

router
  .route('/list')
  .get(controller.fetchCountry);

router
  .route('/search')
  .get(getAuth('master.admin'), Validate(countryValidation.list), controller.list);


router
  .route('/:countryId')
  .get(getAuth('master.admin'), Validate(countryValidation.get), controller.get)
/**
     * update the single location
     * */
  .patch(getAuth('master.admin'), Validate(countryValidation.update), controller.update)
/**
     * delete  the single location
     * */

  .delete(getAuth('master.admin'), Validate(countryValidation.remove), controller.remove);

module.exports = router;
