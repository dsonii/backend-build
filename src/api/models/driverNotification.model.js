const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = Schema;
/**
 * Nofification Schema
 * @private
 */
const driverNotificationSchema = new mongoose.Schema({

    driverId: { type: ObjectId, ref: 'Driver', required: true },
    adminId: { type: ObjectId, ref: 'Admin' },
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    read:{type:Number,default:0},
    meta_data:{type:Object,default:{}}
}, {
    timestamps: true,
});



driverNotificationSchema.statics = {

    async create(title,content,driverId,adminId,meta_data){
           if (!await this.exists({
            content,
            driverId,
            adminId,
            meta_data
        })) {
            const OBj = {
                title,
                content,
                driverId,
                adminId,
                meta_data
            }
            return await new this(OBj).save();
        } else {
            return await this.findOne({
                title,
                content,
                driverId,
                adminId
            }).lean();
        }
    },
    async remove(assignId){

        if(await this.exists({"meta_data.assignId": mongoose.Types.ObjectId(assignId)})){
            return await this.deleteOne({"meta_data.assignId" :mongoose.Types.ObjectId(assignId)});
        }
    }
}


module.exports = mongoose.model("Driver_Notification", driverNotificationSchema);