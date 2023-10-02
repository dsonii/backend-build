const admin = require("firebase-admin");

const driverServiceAccount = require("./files/ferridriver-6c173-firebase-adminsdk-ucep7-83125f95b4.json");

// add your firebase db url here
const FIREBASE_DATABASE_URL =
  "https://ferridriver-6c173-default-rtdb.firebaseio.com";

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