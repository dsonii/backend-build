const admin = require("firebase-admin");
const Setting = require("../models/setting.model"); 


const firebaseAdmin = async () =>{
	const getSetting = await Setting.findOne({},"notifications");
// add your firebase db url here
const FIREBASE_DATABASE_URL = getSetting.notifications.firebase_database_url; //process.env.DATABASE_URL; //";

admin.initializeApp({
  credential: admin.credential.cert(getSetting.notifications.firebase_credential),
  databaseURL: FIREBASE_DATABASE_URL,
});

return admin;	
	
}



module.exports = firebaseAdmin;