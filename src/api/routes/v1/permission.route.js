const express = require('express');
const Joi = require('joi');
const controller = require('../../controllers/permission.controller');
const { authorize, getAuth, LOGGED_USER } = require('../../middlewares/auth');
const Validate = require('../../middlewares/validator');
const { permissionValidation } = require('../../validations');

const router = express.Router();

router
  .route('/')
  .get(getAuth('permissions', 'master.admin'), controller.load)
  .post(
    getAuth('permissions', 'master.admin'),
    Validate(permissionValidation.createPermission),
    controller.create,
  );

// router
//   .route('/search')
//   .get( controller.list);

router
  .route('/:permissionId')

  .get(getAuth('permissions', 'master.admin'), controller.get)
  /**
   * update the single location
   * */
  .patch(
    getAuth('permissions', 'master.admin'),
    Validate(permissionValidation.updatePermission),
    controller.update,
  )
  /**
   * delete  the single location
   * */

  .delete(getAuth('permissions', 'master.admin'), controller.remove);

module.exports = router;
