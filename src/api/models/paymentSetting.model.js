const mongoose = require("mongoose");
//const paginateAggregate = require("mongoose-aggregate-paginate-v2");
const { Schema } = mongoose;

const PaymentSettingSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["Razorypay", "Paymob", "PayStack"],
      required: true,
      index: true,
    },
    info: {
      type: {
        status: { type: Boolean, default: false },
        mode: { type: String, default: "sandbox" },
        merchant_id: { type: String, default: "" },
        username: { type: String, default: "" },
        password: { type: String, default: "" },
        key: { type: String, default: "" },
        secret: { type: String, default: "" },
        callback_url: { type: String, default: "" },
        webhook_url: { type: String, default: "" },
      },
    },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);


PaymentSettingSchema.statics = {
  format(item) {
    return {
      id: item._id,
      name: item.name,
      status: item.status,
      info_status: item.info.status,
      mode: item.info.mode,
      username:item.info.username,
      password:item.info.password,
      key: item.info.key,
      secret: item.info.secret,
      merchant_id: item.info.merchant_id ? item.info.merchant_id : '',
      callback_url: item.info.callback_url,
      webhook_url: item.info.webhook_url,
    };
  },
  formatData(rows) {
    const selectableItems = [];
    let i = 1;
    rows.forEach((item) => {
      selectableItems.push({
        id: item._id,
        name: item.name,
        status: item.status,
        info_status: item.info.status,
        mode: item.info.mode,
        username:item.info.username,
        password:item.info.password,
        key: item.info.key,
        secret: item.info.secret,
        merchant_id: item.info.merchant_id,
        callback_url: item.info.callback_url,
        webhook_url: item.info.webhook_url,
      });
    });
    return selectableItems;
  },
};

/**
 * @typedef Driver
 */
module.exports = mongoose.model("Payment_Setting", PaymentSettingSchema);
