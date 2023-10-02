const admin = require("firebase-admin");
const Setting = require("../models/setting.model");

let initializedApp = null;
const firebaseAdmin = async () => {
  try {
    const getSetting = await Setting.findOne({}, "notifications");
    const firebase_database_url =
      getSetting.notifications.firebase_database_url;
    const firebase_credential = getSetting.notifications.firebase_credential;

    admin.initializeApp({
      credential: firebase_credential ? admin.credential.cert(firebase_credential) : '',
      databaseURL: firebase_database_url ? firebase_database_url : '',
    });
    initializedApp = admin;
    //console.log("Firebase Admin SDK initialized successfully!");
  } catch (err) {
    console.error("Error initializing Firebase:", err);
  }
};

firebaseAdmin();

const firebaseUser = {};

firebaseUser.sendMulticastNotification = async function (payload) {
  try {
    const info_popup = {
      heading: payload.title,
      body: payload.body,
      imgurl: payload.picture,
    };
    const message = {
      tokens: payload.tokens,
      data: {
        title: payload.title,
        message: payload.body,
        info_popup: JSON.stringify(info_popup),
      },
    };

    return await initializedApp.messaging().sendMulticast(message);
  } catch (err) {
    console.log("err", err);
  }
};

firebaseUser.sendSingleMessage = async function (payload) {
  try {
    const info_popup = {
      heading: payload.title,
      body: payload.body,
      imgurl: payload.picture,
    };
    const message = {
      data: {
        title: payload.title,
        message: payload.body,
        info_popup: JSON.stringify(info_popup),
      },
    };

    return initializedApp.messaging().sendToDevice(payload.token,message);
  } catch (err) {
    console.log("err", err);
  }
};

module.exports = firebaseUser;
