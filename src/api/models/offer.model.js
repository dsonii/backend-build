const mongoose = require('mongoose');
const httpStatus = require('http-status');
const mongoosePaginate = require('mongoose-paginate-v2');
const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require('moment-timezone');
const paginateAggregate = require('mongoose-aggregate-paginate-v2');
/**
 * Bus type Schema
 * @private
 */
const offerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    start_date: { type: Date, required: true, index: true },
    end_date: { type: Date, required: true, index: true },
    code: { type: String, required: true, index: true },
    picture: { type: String, default: '' },
    discount: { type: String, index: true },
    attempt: { type: Number, index: true },
    terms: { type: String, required: true },
    type: { type: Boolean, default: true },
    routeId: { type: ObjectId, ref: 'Route', default: null },
    status: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

offerSchema.statics = {
  transformData(rows) {
    const selectableItems = [];
    let i = 1;
    rows.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item._id,
        adminId: item.adminId,
        name: item.name,
        code: item.code,
        discount: item.discount,
        attempt: item.attempt,
        start_date: moment.utc(item.start_date).format('MMM DD, YYYY'),
        end_date: moment.utc(item.end_date).format('MMM DD, YYYY'),
        type: (item.type == true) ? 'route not applied' : 'route applied',
        route_name: (item.routeId != null) ? item.routeId.title : '-',
        terms: item.terms,
        picture: this.isValidURL(item.picture)
          ? item.picture
          : `${process.env.FULL_BASEURL}${item.picture}`,
        status: item.status == true ? 'Active' : 'Inactive',
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format('DD MMM YYYY'),
      });
    });
    return selectableItems;
  },
  isValidURL(str) {
    const regex =
      /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  },
  isValidBase64(str) {
    const regex =
      /^data:image\/(?:gif|png|jpeg|jpg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/g;

    if (regex.test(str)) {
      return true;
    }
    return false;
  },
};

offerSchema.plugin(paginateAggregate);
offerSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('Offer', offerSchema);
