const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/offer.controller');
const { getAuth } = require('../../middlewares/auth');
const { offerValidation } = require('../../validations');

const router = express.Router();


router
  .route('/')
  .post(getAuth('offer.create', 'master.admin'), Validate(offerValidation.createOffer), controller.create);

// router
//     .route('/markers')
//     .get(authorize(ADMIN), controller.load);

router
  .route('/search')
  .get(getAuth('offer.view', 'master.admin'), Validate(offerValidation.listOffer), controller.list);

router
  .route('/:offerId')
  .get(getAuth('offer.edit', 'master.admin'), controller.get)
/**
     * update the single location
     * */
  .patch(getAuth('offer.edit', 'master.admin'), Validate(offerValidation.updateOffer), controller.update)
/**
     * delete  the single location
     * */

  .delete(getAuth('offer.delete', 'master.admin'), Validate(offerValidation.deleteOffer), controller.remove);

module.exports = router;
