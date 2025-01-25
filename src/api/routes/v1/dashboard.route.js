const express = require('express');
// const validate = require('express-validation');
const controller = require('../../controllers/dashboard.controller');
const {
  authorize,
  getAuth,
} = require('../../middlewares/auth');


const router = express.Router();


router
  .route('/count')
  // .get(getAuth('users'), controller.authLists)
  .get(getAuth('manage.dashboard'), controller.countDown);


module.exports = router;
