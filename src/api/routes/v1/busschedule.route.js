const express = require("express");
const Validate = require("../../middlewares/validator");
const controller = require("../../controllers/busschedule.controller");
const { getAuth } = require("../../middlewares/auth");

const router = express.Router();

router
  .route("/")
  .get(getAuth("bus-schedule.get", "master.admin"), controller.search)
  .post(getAuth("bus-schedule.create", "master.admin"), controller.create);

router
  .route("/list")
  .get(getAuth("bus-schedule.create", "master.admin"), controller.list);

router
  .route("/:busScheduleId")
  .get(getAuth("bus-schedule.get", "master.admin"), controller.get)
  .patch(getAuth("bus-schedule.update", "master.admin"), controller.update)
  .post(getAuth("bus-schedule.update", "master.admin"), controller.status)
  .delete(getAuth("bus-schedule.delete", "master.admin"), controller.remove);

module.exports = router;
