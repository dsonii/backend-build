const mongoose = require("mongoose");
const logger = require("./../config/logger");
const { mongo, env } = require("./vars");

// set mongoose Promise to Bluebird
mongoose.Promise = Promise;

const host = mongo.host;
const username = mongo.username;
const password = encodeURIComponent(mongo.password);
const database = mongo.db;
const rs = mongo.rs;
console.log("mongoDBDATABASE", database);
const mongoDBURL = mongo.uri
  ? mongo.uri
  : `mongodb+srv://${username}:${password}@${host}/${database}`;
//const mongoDBURLNew = `${mongoDBURL}${database}`;

// Exit application on error
mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});



// print mongoose logs in dev env
if (env === "development") {
  mongoose.set("debug", true);
}
mongoose.set("strictQuery", true);
/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */

exports.connect = () => {
  mongoose
    .connect(mongoDBURL, {
      keepAlive: true,
      autoIndex: false,
    })
    .then(() => console.log("mongoDB connected..."));
  return mongoose.connection;
};
