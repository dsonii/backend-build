const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/timetable.controller');
const { getAuth } = require('../../middlewares/auth');
const { timetableValidation } = require('../../validations');
const multer = require('multer');

const upload = multer({});

const router = express.Router();

router.route('/test').get(controller.testData);

router
  .route('/')
  .get(
    getAuth('timetable.view', 'master.admin'),
    Validate(timetableValidation.listTimeTable),
    controller.list,
  )
  .post(
    getAuth('timetable.create', 'master.admin'),
    Validate(timetableValidation.createTimeTable),
    controller.create,
  );

router
  .route('/:timetableId/status')
  /**
   *  update status
   * * */
  .patch(getAuth('timetable.edit', 'master.admin'), controller.status);

router
  .route('/:timetableId')

  .get(getAuth('timetable.edit', 'master.admin'), controller.get)
  /**
   * update the single location
   * */
  .patch(
    getAuth('timetable.edit', 'master.admin'),
    Validate(timetableValidation.updateTimeTable),
    controller.update,
  )
  /**
   * delete  the single location
   * */

  .delete(
    getAuth('timetable.delete', 'master.admin'),
    Validate(timetableValidation.deleteTimeTable),
    controller.remove,
  );

module.exports = router;
