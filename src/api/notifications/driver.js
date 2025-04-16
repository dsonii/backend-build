const Setting = require("../models/setting.model");
const FCM = require("fcm-node");
const apnProvider = require("../utils/apn");
const apn = require("apn");

const DriverNotification = async (title, message, data, token, type) => {
  const getSetting = await Setting.findNotifySettings();
  const fcm = new FCM(getSetting.notifications.driver_secret_key);

  if (type === 1) {
    // 1 == android
    if (typeof data == "object") {
      const content = {
        to: token,
        data: {
          title: title,
          message: message,
          data: data,
        },
      };
    } else {
      const content = {
        to: token,
        data: {
          title: title,
          message: message,
        },
      };
    }
    fcm.send(content, function (err, response) {
      if (err) {
        console.log("err while Driver :" + err);
      } else {
        console.log("Successfully sent Driver  with response: ", response);
        return response;
      }
    });
  } else if (type == 2) {
    // 2 === ios
    let notification = new apn.Notification();
    if (typeof data == "object") {
      notification.title = title;
      notification.body = message;
      notification.rawPayload = JSON.stringify(data);

    } else {
      notification.title = title;
      notification.body = message;
    }

    apnProvider.send(notification, token).then((err, response) => {
      // see documentation for an explanation of result
      if (err) {
        console.log("err while Driver :" + err);
      } else {
        console.log("Successfully sent Driver  with response: ", response);
        return response;
      }
    });
  }
};

module.exports = {
  DriverNotification,
};
