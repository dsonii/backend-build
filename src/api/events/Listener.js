const events = require("events");
const bluebird = require("bluebird");
const eventsListener = new events.EventEmitter();
eventsListener.emitAsync = bluebird.promisifyAll(eventsListener.emit);
const AdminDetail = require("../models/adminDetail.model");
const Admin = require("../models/admin.model");
const mongoose = require("mongoose");
const s3 = require("../../config/s3");
const BookingAssign = require("../models/bookingAssign.model");
const Ticket = require("../models/ticket.model");
const Booking = require("../models/booking.model");


eventsListener.on("Delete-s3-Admin-Detail", async (adminId) => {
  try {
    const FolderName = process.env.S3_BUCKET_AGENTDOC;
    const admins = await Admin.findOne({_id:adminId});
  
    if (admins.picture != null) {
      console.log('admins',admins.picture)
      Admin.isValidURL(admins.picture)
        ? await s3.imageDelete(admins.picture, FolderName)
        : "";
    }
    const admindetail = await AdminDetail.findOne({ adminId: adminId });
    if (admindetail.document_gst_certificate != null) {
      Admin.isValidURL(admindetail.document_gst_certificate)
        ? await s3.imageDelete(admindetail.document_gst_certificate, FolderName)
        : "";
    }
    if (admindetail.document_pan_card != null) {
      Admin.isValidURL(admindetail.document_pan_card)
        ? await s3.imageDelete(admindetail.document_pan_card, FolderName)
        : "";
    }
  } catch (err) {
    console.log("err", err);
  }
});

eventsListener.on("Add-Admin-Detail", async (RequestObj) => {
  const admindetail = new AdminDetail(RequestObj);
  const savedAdminDetail = await admindetail.save();
});

eventsListener.on("Update-Admin-Detail", async (adminId, RequestObj) => {
  try {
    const getadmindetail = await AdminDetail.findOneAndUpdate(
      { adminId: mongoose.Types.ObjectId(adminId) },
      RequestObj,
      {
        new: true,
      }
    );
    // console.log('getadmindetail',getadmindetail)
  } catch (err) {
    console.log("err", err);
    return err;
  }
});

eventsListener.on("UPDATE-TICKET", async(busId) => {
    const getBus = await Bus.findById(busId).populate({ path: "buslayoutId", model: "Bus_Layout", select: "max_seats" });
    await Ticket.update(ticketId, getBus.buslayoutId.max_seats)
});

eventsListener.on("CREATE-TICKET", async(busId) => {
    const getBus = await Bus.findById(busId).populate({
        path: "buslayoutId",
        model: "Bus_Layout",
        select: "max_seats"
    });
    await Ticket.create(busId, getBus.buslayoutId.max_seats); // 
});


eventsListener.on("REMOVE-TICKET", async(busId) => {
    await Ticket.remove(busId); // 
});


eventsListener.on("UPDATE-BUS-BOOKING",async(busId,routeId) => {
    try{
      const bookingExist = await Booking.find({routeId,'travel_status':'SCHEDULED'}).lean();
        if(bookingExist.length > 0){
          const bookingIds = bookingExist.map( (v,i) => v._id);
          await Booking.updateMany({_id:{ $in: bookingIds }},{busId});
        }

    }catch(err){
      console.log("err", err);
      return 'err while : '+err;
    }
});


exports.eventsListener = eventsListener;
