const admin = require("firebase-admin");

const driverServiceAccount = require("./files/lastmilemobility-d9439-firebase-adminsdk-l0asf-3d2e8ea861");

// add your firebase db url here
const FIREBASE_DATABASE_URL =
  "https://lastmilemobility-d9439-default-rtdb.firebaseio.com";

admin.initializeApp({
  credential: admin.credential.cert(driverServiceAccount),
  databaseURL: FIREBASE_DATABASE_URL,
});

const firebaseDriver = {};

firebaseDriver.sendMulticastNotification = function (payload) {
  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    tokens: payload.tokens,
    data: payload.data || {},
  };

  return admin.messaging().sendMulticast(message);
};

module.exports = firebaseDriver;