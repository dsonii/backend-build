const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/resource.controller');
const {
  authorize,
  getAuth,
} = require('../../middlewares/auth');
const {
  listResources,
  createResources,
  updateResources,
  replaceResources,
} = require('../../validations/resource.validation');

const router = express.Router();


router
  .route('/')
  .get(getAuth('resources'), controller.load)
  .post(getAuth('resources'), validate(createResources), controller.create);

  
router
.route('/:role')
.get(getAuth('resources'), controller.load)

router
  .route('/search')
  .get(getAuth('resources'), validate(listResources),controller.list);


router
  .route('/:resourceId')

  .get(getAuth('resources'), controller.get)
  /**
  * update the single location
  * */
  .patch(getAuth('resources'), validate(updateResources), controller.update)
/**
  * delete  the single location
  * */

  .delete(getAuth('resources'), validate(replaceResources),controller.remove);

module.exports = router;
