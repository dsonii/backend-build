const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/route.controller');
const { getAuth } = require('../../middlewares/auth');
const {
  listRoute,
  createRoute,
  updateRoute,
} = require('../../validations/route.validation');
const multer = require('multer');

const upload = multer({});

const router = express.Router();

router
  .route('/test')
  .get(controller.testData);


router
  .route('/stops/:routeId')
  .get(controller.loadStops);


router
  .route('/')
  .get(controller.load)

  .post(getAuth('route.create', 'master.admin'), Validate(createRoute), controller.create);

router
  .route('/:locationId/options')
  .get(controller.getLocationRoute);


router
  .route('/search')
  .get(getAuth('route.view', 'master.admin'), Validate(listRoute), controller.list);

router
  .route('/find/:search')
  .get(getAuth('route.view', 'master.admin'), controller.search);

router
  .route('/data')
  .get(getAuth('route.view', 'master.admin'), controller.loadData);

router
  .route('/:routeId/status')
  /**
   *  update status
   * * */
  .patch(getAuth('route.edit', 'master.admin'), controller.status);


router
  .route('/:routeId')

  .get(getAuth('route.edit', 'master.admin'), controller.get)
  .patch(getAuth('route.edit', 'master.admin'),Validate(updateRoute), controller.update)
/**
  * delete  the single location
  * */

  .delete(getAuth('route.delete', 'master.admin'), controller.remove);

router
  .route('/route-detail/:routeDetailId')

  .delete(getAuth('route.delete', 'master.admin'), controller.removeRouteDetail);


module.exports = router;
