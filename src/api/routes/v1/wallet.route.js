const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/wallet.controller');
const {
  getAuth,
} = require('../../middlewares/auth');
const { walletValidation } = require('../../validations');

const router = express.Router();


router
  .route('/')
  .post(getAuth('customer.wallet.create', 'master.admin'), Validate(walletValidation.createWallet), controller.create);

module.exports = router;
