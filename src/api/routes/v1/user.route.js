const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/user.controller');
const { getAuth } = require('../../middlewares/auth');
const { userValidation } = require('../../validations');

const router = express.Router();


router
  .route('/')
  // .get(getAuth('users'), controller.authLists)
  .post(getAuth('customer.create', 'master.admin'), controller.create);

router.route('/search').get(getAuth('customer.view', 'master.admin'), controller.list);
router.route('/wallet-histories').get(getAuth('customer.wallet.history.view', 'master.admin'), controller.walletHistories);

router.route('/q').get(getAuth('customer.view', 'master.admin'), controller.search);

router
  .route('/:userId')
  .get(getAuth('customer.edit', 'master.admin'), controller.get)
  /**
   * update the single location
   * */
  .patch(getAuth('customer.edit', 'master.admin'), controller.update)
/**
  * delete  the single location
  * */
  .delete(getAuth('customer.delete', 'master.admin'), controller.remove);


module.exports = router;
