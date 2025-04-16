const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/driver.controller');
const {
  authorize,
  getAuth,
  LOGGED_USER,
} = require('../../middlewares/auth');
const { driverValidation } = require('../../validations');

const multer = require('multer');

const upload = multer({});


const router = express.Router();

router
  .route('/test')
  .get(controller.testData);

router.route("/is-exists").post(controller.isDriverExists);

router
  .route('/q')

  .get(getAuth('driver.view', 'master.admin'), controller.search);


router
  .route('/')
  .get(getAuth('driver.view', 'master.admin'), Validate(driverValidation.listDrivers), controller.list)
  .post(getAuth('driver.create', 'master.admin'), controller.create);

router
  .route('/:driverId/status')
/**
     *  update status
     * * */
  .patch(getAuth('driver.edit', 'master.admin'), controller.status);


router
  .route('/:driverId')

  .get(getAuth('driver.edit', 'master.admin'), controller.get)
/**
     * update the single location
     * */
  .patch(getAuth('driver.edit', 'master.admin'),  controller.update)
/**
     * delete  the single location
     * */

  .delete(getAuth('driver.delete', 'master.admin'), Validate(driverValidation.deleteDriver), controller.remove);

router
  .route('/:driverId/document')
  .patch(upload.single('pic'), controller.uploadDocument);


module.exports = router;
