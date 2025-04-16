const mongoose = require("mongoose");
//const paginateAggregate = require("mongoose-aggregate-paginate-v2");
const { Schema } = mongoose;

const PaymentGatewaySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      default: "",
    },
    value: {
      type: String,
      required: true,
      index: true,
      default: "",
    },
    site: {
      type: String,
      enum: ["Razorypay", "Paymob", "PayStack"],
      required: true,
      index: true,
      default: "",
    },
  }
);

PaymentGatewaySchema.statics = {
  findBySite(site) {
    return this.find({ site }).lean();
  },
};


/**
 * @typedef Driver
 */
module.exports = mongoose.model("Payment_Gateway", PaymentGatewaySchema);
