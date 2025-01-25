const express = require('express');
const controller = require('../../controllers/managemap.controller');
const {
  authorize,
  getAuth,
  LOGGED_USER,
} = require('../../middlewares/auth');


const router = express.Router();


router
  .route('/data')
  .get(getAuth('master.admin'), controller.driverData);




module.exports = router;
