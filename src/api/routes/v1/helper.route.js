const express = require('express');
const controller = require('../../controllers/helper.controller');
const {
  authorize,
  getAuth,
  LOGGED_USER,
} = require('../../middlewares/auth');


const router = express.Router();


router
  .route('/search')
  .get(getAuth('help.support.view', 'master.admin'), controller.list);


router
  .route('/:helperId')
  .patch(getAuth('help.support.edit', 'master.admin'), controller.reply)
  .delete(getAuth('help.support.delete', 'master.admin'), controller.remove);


module.exports = router;
