const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');
const mongoosePaginate = require('mongoose-paginate-v2');
const paginateAggregate = require('mongoose-aggregate-paginate-v2');
const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require('moment-timezone');

const routines = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

// const routineSchema = new Schema({
//   routine: { type: [String],default: [''], required: true },
// },{ timestamps: true });

const timeTableSchema = new Schema(
  {
    routeId: { type: ObjectId, ref: 'Route', required: true },
    busId: { type: ObjectId, ref: 'Bus' },
    direction:{type: String, required: true},
    every:{ type: [String],enum:routines},
    time: {type: Date, required: true},
    start_date:{type:Date,default:''},
    end_date:{type:Date,default:''},
    status: { type: Boolean, default: true }
  },
  { timestamps: true },
);


timeTableSchema.virtual('routestops', {
  ref: 'Route_Stop', // the model to use
  localField: 'routeId', // find children where 'localField'
  foreignField: 'routeId', // is equal to foreignField
  justOne: true,
});


timeTableSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'direction', 'day', 'time','start_date','end_date', 'status', 'createdAt'];
    fields.forEach((field) => {
      transformed[field] = this[field];
    });
    return transformed;
  },
});


timeTableSchema.statics = {
  async transFormSingleData(row){
    try{
      return{
        id:row.id,
        every:row.every,
        direction:row.direction,
        time:row.time,
        start_date:row.start_date,
        end_date:row.end_date,
        busId:row.busId,
        routeId: row.routeId._id,
        stops:row.routestops.stops,
        status: row.status,
      }
    }catch(err){
      console.log('err',err)
      return err;
    }
 
  },
  transformData(rows){
    const selectableItems = [];
    let i = 1;
    rows.forEach((item) => {
      selectableItems.push({
        id:i++,
        ids: item.id,
        direction:item.direction,
        time: moment(item.time).tz(DEFAULT_TIMEZONE).format("HH:MM A"),
        bus_name: (item.busId) ? item.busId.name : '',
       // busId: (item.busId) ? item.busId._id : '',
        route_name: (item.routeId) ? item.routeId.title : '',
        routeId: (item.locationId) ? item.routeId._id : '',
        status: item.status == true ? "Active" : "Inactive",
        createdAt: moment(item.createdAt).tz(DEFAULT_TIMEZONE).format("DD MMM YYYY"),
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


timeTableSchema.plugin(mongoosePaginate);
timeTableSchema.plugin(paginateAggregate);


module.exports = mongoose.model('TimeTable', timeTableSchema);
