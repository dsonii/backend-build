const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/routebus.controller');
const {
  authorize,
  ADMIN,
  STAFF,
  LOGGED_USER,
} = require('../../middlewares/auth');
// const {
//   listTimeTable,
//   createTimeTable,
//   updateTimeTable,
// } = require('../../validations/timetable.validation');
const multer = require('multer');

const upload = multer({});


const router = express.Router();




router
  .route('/:id')

  .get(authorize([ADMIN,STAFF]), controller.get)
  /**
  * update the single location
  * */
  .patch(authorize([ADMIN,STAFF]), controller.update)
/**
  * delete  the single location
  * */

  //.delete(authorize([ADMIN]), controller.remove);

module.exports = router;
