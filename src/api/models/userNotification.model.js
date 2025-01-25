const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = Schema;
/**
 * Nofification Schema
 * @private
 */
const userNotificationSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'User', required: true },
    helperId: { type: ObjectId, ref: 'Helper', default:null },
    adminId: { type: ObjectId, ref: 'Admin', default:null  },
    title: { type: String, default: '' },
    read: { type: Number, default: 0 },
    type:{type:String,enum:["wallet","support","referral","trip","passes","refund"],default:"wallet"},
    content: { type: String, default: '' },
    meta_data: { type: Object, default: {} }
}, {
    timestamps: true,
});


userNotificationSchema.statics = {
    async create(type,title,content, userId, adminId, meta_data) {
        if (!await this.exists({
            title,
            userId,
            adminId,
            meta_data
        })) {
            const OBj = {
                title,
                userId,
		helperId:meta_data.helperId,
                adminId,
                content,
		type,
                meta_data
            }
            return await new this(OBj).save();
        } else {
            return await this.findOne({
                title,
                content,
                userId,
                adminId,
                meta_data
            }).lean();
        }
    },
    async remove(replyId) {

        if (await this.exists({ "meta_data.assignId": mongoose.Types.ObjectId(replyId) })) {
            return await this.deleteOne({ "meta_data.replyId": mongoose.Types.ObjectId(replyId) });
        }
    }

}


module.exports = mongoose.model("User_Notification", userNotificationSchema);