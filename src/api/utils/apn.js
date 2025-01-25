const apn = require("apn");
const Setting = require("../models/setting.model");

const apnProvider = async () => {
  const getSetting = await Setting.findOne({}, "notifications").lean();
  const options = {
    token: {
      key: getSetting.notifications.apple_key,
      keyId: getSetting.notifications.apple_key_id,
      teamId: getSetting.notifications.apple_team_id,
    },
    production: process.env.NODE_ENV === "production",
  };
  return new apn.Provider(options);
};

module.exports = apnProvider;
