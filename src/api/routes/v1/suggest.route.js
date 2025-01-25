const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/suggest.controller');
const { getAuth } = require('../../middlewares/auth');

const { suggestValidation } = require('../../validations');

const router = express.Router();

router
  .route('/search')
  .get(
    getAuth('suggests', 'master.admin'),
    Validate(suggestValidation.listSuggests),
    controller.list,
  );

router
  .route('/:suggestId')

  .get(getAuth('suggests', 'master.admin'), controller.get);

module.exports = router;
