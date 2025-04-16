const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const objectIdToTimestamp = require("objectid-to-timestamp");
const moment = require("moment-timezone");

const HelperSchema = new mongoose.Schema({
     ticket_no:{type:String,index:true},
    firstname: { type: String, index:true, default: '' },
    lastname: { type: String, index:true,default: '' },
    gender: { type: String, index:true, default: '' },
    email: {
        type: String,
        minlength: 1,
        trim: true,
        index:true
    },
    phone: {
        type: String,
        trim: true,
        index:true
    },
    helpemail: {
        type: String,
        minlength: 1,
        trim: true,
        index:true
    },
    reply:{type: Object,default:{}},
    // contact: {
    //     type: String,
    //     trim: true,
    //     index:true
    // },
    description: { type: String, default: '' },
    status:{type:String,enum:['Pending','Replied'],default:'Pending'}
}, { timestamps: true });


HelperSchema.statics = {

   transformDataLists(data) {
    const selectableItems = [];
    let i = 1;
    data.forEach(async (item) => {
      selectableItems.push({
        id: i++,
        ids: item._id,
        ticket_no:item.ticket_no,
        firstname: item.firstname,
        lastname: item.lastname,
        gender: item.gender,
        email: item.email,
        phone: item.phone,
        helpemail:item.helpemail,
        contact:item.contact,
		description_short: item.description.substring(0, 10) + "...",
        description:item.description,
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(`${DEFAULT_DATEFORMAT} ${DEFAULT_TIMEFORMAT}`),
      });

      // if(await this.exists({ticket_no:null})){
      //    const update ={
      //     ticket_no:objectIdToTimestamp(item._id),
      //     firstname: item.firstname,
      //     lastname: item.lastname,
      //     gender: item.gender,
      //     email: item.email,
      //     phone: item.phone,
      //     helpemail:item.helpemail,
      //     contact:item.contact,
      //     description:item.description,
      //    }
      //    await this.updateOne({_id:item._id},update)
      // }
    });
    return selectableItems;
  },
}

HelperSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('Helper', HelperSchema);
