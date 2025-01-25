const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/bus.controller');
const {
  authorize,
  getAuth,
  LOGGED_USER,
} = require('../../middlewares/auth');
const { busValidation } = require('../../validations');

const multer = require('multer');

const upload = multer({});


const router = express.Router();


router
  .route('/route')
  .get(controller.loadByRoute);

router
  .route("/is-exists")
  .post(controller.isRegistrationExists);
  
router
  .route('/')
  .get(getAuth('bus.load', 'master.admin'), controller.load)
  .post(getAuth('bus.create', 'master.admin'), Validate(busValidation.createBuses), controller.create);


router
  .route('/search')
  .get(getAuth('bus.view', 'master.admin'), Validate(busValidation.listBuses), controller.list);


router
  .route('/:busId')

  .get(getAuth('bus.edit', 'master.admin'), controller.get)
  /**
  * update the single location
  * */
  .patch(getAuth('bus.edit', 'master.admin'), Validate(busValidation.updateBuses), controller.update)
/**
  * delete  the single location
  * */

  .delete(getAuth('bus.delete', 'master.admin'), Validate(busValidation.deleteBuses), controller.remove);

router
  .route('/:busId/:document_type')
  .patch(getAuth('buses', 'master.admin'), upload.single('pic'), controller.uploadDocument);


module.exports = router;
