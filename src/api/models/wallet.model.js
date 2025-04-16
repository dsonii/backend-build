const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const mongoosePaginate = require("mongoose-paginate-v2");
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const creditSchema = new mongoose.Schema({
  amount: {
      type: Number,
  },
  date_of_reg: {
      type: Date
  },
  date_of_exp: {
      type: Date
  },
  referedto: {
      type: ObjectId,
      ref: "User"
  },
  is_deleted:{type: Boolean, default: false},
  status: {
      type: Boolean,
      default: false
  }
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
  users: { type: ObjectId, ref: "User", required: true },
  refercode: {
      type: String,
      trim: true,
      unique: true,
  },
  amount: {
      type: Number,
      default: 0
  },
  credit: [creditSchema]
}, { timestamps: true });


walletSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Wallet', walletSchema);
