const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/city.controller');
const {
  authorize,
  getAuth,
} = require('../../middlewares/auth');
const multer = require('multer');

const upload = multer({});


const router = express.Router();


router
  .route('/')
  .get(getAuth('cities', 'master.admin'), controller.load);


module.exports = router;
