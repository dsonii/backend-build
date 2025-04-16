const mongoose = require("mongoose");
const { omitBy, isNil } = require("lodash");
const { Schema } = mongoose;
const moment = require("moment-timezone");
const { ObjectId } = Schema;
const mongoosePaginate = require('mongoose-paginate-v2');
const objectIdToTimestamp = require("objectid-to-timestamp");
const paginateAggregate = require('mongoose-aggregate-paginate-v2');
const { env, FULLBASEURL } = require("../../config/vars");

const bookingAsignSchema = new Schema(
  {
    adminId: { type: ObjectId, ref: 'Admin', required: false },
    ticketId: { type: ObjectId, ref: 'Ticket' },
    routeId: { type: ObjectId, ref: 'Route', required: false },
    busScheduleId: { type: ObjectId, ref: 'Bus_Schedule', required: true },
    driverId: { type: ObjectId, ref: 'Driver', required: true,default:null },
    assistantId: { type: ObjectId, ref: 'Driver',default:null },
    dates: { type: [Date], index: true },
    status: { type: Boolean, default: true },
    angle:{type:String,default:""},
    location: {
        type: { type: String, default: "Point" },
        address: { type: String, default: "" },
        coordinates: [Number],
    },
    trip_status: { type: String, enum: ['ASSIGNED',"EXPIRED",'STARTED', 'COMPLETED', 'NOTSTARTED', 'RIDING'], default: "ASSIGNED" }

  }, {
  timestamps: true,
})

//assistant


bookingAsignSchema.statics = {
  formatData(item){
    return{
      route:{
departure_time:item.busScheduleId.departure_time,
arrival_time:item.busScheduleId.arrival_time,
status:item.busScheduleId.status,
id:item.busScheduleId._id,
routeId:item.routeId._id,
route_name:item.routeId.title
      },
      trip_status:item.trip_status,
      driver:{
        id:item.driverId._id,
        title:item.driverId.firstname+' '+item.driverId.lastname,
        pageid: objectIdToTimestamp(item._id),
        country_code:item.driverId.country_code,
        phone:item.driverId.phone,
        picture:this.isValidURL(item.driverId.picture)
            ? item.driverId.picture
            : `${FULLBASEURL}public/drivers/profiles/` + item.driverId.picture
      },
      dates:this.formatDates(item.dates),
      assistant:{
      }
    }
  },
  isValidURL(str) {
    const regex =
      /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  },
  formatDates(dates){
    const selectableItems = [];
    dates.forEach((item) => {
      selectableItems.push(moment(item).tz(DEFAULT_TIMEZONE))
    });
    return selectableItems;
  },
  async isExistDateTime(driver,route, dates) {
    const isExists = await this.find({
      busScheduleId: route.id,
      routeId: route.routeId,
      driverId: driver.id,
      dates: { $in : dates}
    })
    if (isExists.length > 0) {
      return true
    }
    return false
  },
  filterAssistant(data) {
    const selectableItems = [];
    let i = 1;
    data.forEach((item) => {
      selectableItems.push(item.id);
    });
    return selectableItems
  },
  transformDataLists(data) {
    const selectableItems = [];
    let i = 1;
    data.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids:item._id,
        adminId: item.adminId._id,
        admin_name: item.adminId.firstname,
        routeId: item.routeId ? item.routeId._id : '',
        route_name: item.routeId ? item.routeId.title : '',
        driverId: item.driverId ? item.driverId._id : '',
        driver_name: item.driverId ?`${item.driverId.firstname} ${item.driverId.lastname} <br> <b>${item.driverId.phone}</b>` : '',
        date_time: moment(item.date_time).tz(DEFAULT_TIMEZONE).format('LLL'),
        assistantId: this.convertToHtml(item.assistantId),
        trip_status:item.trip_status,
        location:item.location
      });

    });
    return selectableItems
  },
  convertToHtml(data) {
    let html = '';
    data.forEach((item) => {

      html += `<p>${item.firstname} : ${item.phone}</p>`
    });
    return html;
  }
}

bookingAsignSchema.plugin(mongoosePaginate);
bookingAsignSchema.plugin(paginateAggregate);


module.exports = mongoose.model("BookingAssign", bookingAsignSchema);
