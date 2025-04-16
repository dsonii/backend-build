const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/pass.controller');
const { getAuth } = require('../../middlewares/auth');
const { passValidation } = require('../../validations');


const router = express.Router();


router
  .route('/')
  .post(getAuth('pass.create', 'master.admin'), Validate(passValidation.createPass), controller.create);


router
  .route('/search')
  .get(getAuth('pass.view', 'master.admin'), Validate(passValidation.listPass), controller.list);


router
  .route('/:passId')
  .get(getAuth('pass.edit', 'master.admin'), Validate(passValidation.getPass), controller.get)
/**
     * update the single location
     * */
  .patch(getAuth('pass.edit', 'master.admin'), Validate(passValidation.updatePass), controller.update)
/**
     * delete  the single location
     * */

  .delete(getAuth('pass.delete', 'master.admin'), Validate(passValidation.deletePass), controller.remove);

module.exports = router;
