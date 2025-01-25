const express = require("express");
const controller = require("../../controllers/setting.controller");

const { authorize, ADMIN, getAuth } = require("../../middlewares/auth");

const router = express.Router();

router.route("/term-and-conditions").get(controller.terms);

router.route("/privacy").get(controller.privacy);

router
  .route("/")
  .post(
    getAuth("manage.application.settings", "master.admin"),
    controller.create
  );

router
  .route("/:type")
  .get(getAuth("manage.application.settings", "master.admin"), controller.get);

router.route("/app/general").get(controller.fetch);

router
  .route("/:settingId")
  /**
   * update the single location
   * */
  .patch(
    getAuth("application.settings.edit", "master.admin"),
    controller.update
  );

router
  .route("/:settingId/notifications")
  /**
   * update the single location
   * */
  .patch(getAuth("master.admin"), controller.updateNotificationSetting);

module.exports = router;
