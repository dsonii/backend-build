const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/buslayout.controller');
const { getAuth } = require('../../middlewares/auth');
const { buslayoutValidation } = require('../../validations');


const router = express.Router();

router
  .route('/')
  .get(getAuth('bus.layout.view', 'master.admin'), controller.load)
  .post(getAuth('bus.layout.create', 'master.admin'), Validate(buslayoutValidation.createBusLayouts), controller.create);

router
  .route('/search')
  .get(getAuth('bus.layout.view', 'master.admin'), Validate(buslayoutValidation.listBusLayouts), controller.list);


router
  .route('/:buslayoutId')

  .get(getAuth('bus.layout.edit', 'master.admin'), controller.get)
  /**
  * update the single location
  * */
  .patch(getAuth('bus.layout.edit', 'master.admin'), Validate(buslayoutValidation.updateBusLayouts), controller.update)
/**
  * delete  the single location
  * */

  .delete(getAuth('bus.layout.delete', 'master.admin'), Validate(buslayoutValidation.deleteBusLayouts), controller.remove);

module.exports = router;
