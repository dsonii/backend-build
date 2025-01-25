const mongoose = require("mongoose");
const httpStatus = require("http-status");
const { omitBy, isNil } = require("lodash");
const APIError = require("../utils/APIError");
const mongoosePaginate = require("mongoose-paginate-v2");
const moment = require("moment-timezone");
/**
 * City Schema
 * @private
 */
const citySchema = new mongoose.Schema(
  {
    city: {
      type: String,
      index: true,
      trim: true,
    },
    lat: {
      type: String,
      trim: true,
    },
    lng: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      index: true,
      trim: true,
    },
    iso2: {
      type: String,
      trim: true,
    },
    admin_name: {
      type: String,
      trim: true,
    },
    capital: {
      type: String,
      trim: true,
    },
    population: {
      type: String,
      trim: true,
    },
    population_proper: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

citySchema.statics = {

  transformOptions(data){
    const selectableItems = [];
    const i = 1;
    data.forEach((item) => {
      selectableItems.push({
        id:item._id,
        name:item.city
      });
    });
    return selectableItems;
  },

}

citySchema.plugin(mongoosePaginate);

/**
 * @typedef city
 */
module.exports = mongoose.model("City", citySchema);
