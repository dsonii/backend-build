const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/currency.controller');
const { getAuth } = require('../../middlewares/auth');
const { currencyValidation } = require('../../validations');


const router = express.Router();


router
  .route('/')
  .post(getAuth('currency.create', 'master.admin'), Validate(currencyValidation.create), controller.create);

router
  .route('/list')
  .get(controller.fetchCurrency);


router
  .route('/search')
  .get(getAuth('currency.view', 'master.admin'), Validate(currencyValidation.list), controller.list);


router
  .route('/:currencyId')
  .get(getAuth('currency.edit', 'master.admin'), Validate(currencyValidation.get), controller.get)
/**
     * update the single location
     * */
  .patch(getAuth('currency.edit', 'master.admin'), Validate(currencyValidation.update), controller.update)
/**
     * delete  the single location
     * */

  .delete(getAuth('currency.delete', 'master.admin'), Validate(currencyValidation.remove), controller.remove);

module.exports = router;
