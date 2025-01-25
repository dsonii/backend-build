const express = require("express");
// const validate = require('express-validation');
const controller = require("../../controllers/upload.controller");

const router = express.Router();


router
    .route('/store/:type')
    .post(controller.store);


router
    .route('/delete/:type')
    .post(controller.remove);
module.exports = router;