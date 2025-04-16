const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');
const mongoosePaginate = require('mongoose-paginate-v2');
const moment = require('moment-timezone');
require("mongoose-long")(mongoose);
const {
  Types: { Long },
} = mongoose;
const { Schema } = mongoose;
const { ObjectId } = Schema;
const objectIdToTimestamp = require('objectid-to-timestamp')
const paginateAggregate = require('mongoose-aggregate-paginate-v2');


const RouteSchema = new Schema(
{
    integer_id:{type:Long,default:1,unique:true},
    title: { type: String, required: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true },
);


RouteSchema.method({
    transform() {
        const transformed = {};
        const fields = ['id', 'title', 'status', 'createdAt'];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });
        return transformed;
    }
});


RouteSchema.virtual("routestops", {
  ref: "Route_Stop", // the model to use
  localField: "_id", // find children where 'localField'
  foreignField: "routeId", // is equal to foreignField
  justOne: true,
});

RouteSchema.virtual('routedetails', {
  ref: 'RouteDetail', // the model to use
  localField: '_id', // find children where 'localField'
  foreignField: 'routedetailId', // is equal to foreignField
  justOne: true,
});



RouteSchema.statics = {
  async get(routeId){
    try{
      const route= await this.findById(routeId)
      .populate({
        path: "routedetails",
        populate: { path: "locationId", select: "location title type" }
      })
      .populate({ path: "locationId", select: "location title type" })
      .lean();

      const getData = await this.transFormSingleData(route);
      return getData;
    }catch(err){
      console.log('err',err)
      return err;

    }
  },
  transformOptions(data){
    const selectableItems = [];
    const i = 1;
    data.forEach((item) => {
      selectableItems.push({
        value:item._id,
        text:item.title
      });
    });
    return selectableItems;
  },
  formatRoute(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: item._id,
        pageid: objectIdToTimestamp(item._id),
        title: item.title,
      });
    });
    return selectableItems;
  },
  transFormSingleData(row){
    return{
      id:row._id,
      title:row.title,
      stops: row.routestops.stops,
      status: row.status,
    }
  },
  transformData(rows){
    const selectableItems = [];
    let i = 1;
    rows.forEach((item) => {
      selectableItems.push({
        id:i++,
        ids: item._id,
        title:item.title,
        total_stops:(item.routestops) ? item.routestops.stops.length : 0,
       // stops:(item.routestops) ? item.routestops : [{}],
        status: item.status == true ? "Active" : "Inactive",
        createdAt: moment.utc(item.createdAt).tz(DEFAULT_TIMEZONE).format(DEFAULT_DATEFORMAT),
      });
    });
    return selectableItems;
  },
  list({
    page = 1, perPage = 30, title
  }) {
    const options = omitBy({
    }, isNil);

        return this.find(options)
            .sort({ createdAt: -1 })
            .skip(perPage * (page - 1))
            .limit(perPage)
            .exec();
    },
}


RouteSchema.plugin(mongoosePaginate);
RouteSchema.plugin(paginateAggregate);


module.exports = mongoose.model('Route', RouteSchema);

