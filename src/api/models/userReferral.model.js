const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = Schema;
const mongoosePaginate = require("mongoose-paginate-v2");
const AggregatePaginate = require('mongoose-aggregate-paginate-v2');
const moment = require("moment-timezone")

const UserReferralSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: "User", required: true },
    refferalId: { type: ObjectId, ref: "User", required: true },
    user_type: { type: String, default: 'Customer', index: true },
    start_date: { type: Date, index: true },
    end_date: { type: Date, index: true },
    days: { type: Number, index: true },
    trips: { type: Number, index: true, default: 0, index: true },
    amount: { type: String, index: true },
    pending_amount: { type: String, index: true },
    payment_status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending",
        index: true
    }
}, { timestamps: true });




UserReferralSchema.statics = {
    transformData(data) {
        const selectableItems = [];
        let i = 1;
        data.forEach((item) => {
            selectableItems.push({
                id: i++,
                ids: item._id,
                user: {
                    firstname: item.userId.firstname
                },
                referral: {
                    firstname: item.refferalId.firstname
                },
                amount: item.amount,
                pending_amount: item.pending_amount,
                days: item.days,
                start_date: moment(item.start_date).tz(DEFAULT_TIMEZONE).format("LLL"),
                end_date: moment(item.end_date).tz(DEFAULT_TIMEZONE).format("LLL"),
                payment_status: item.payment_status
            });
        })
        return selectableItems
    }
}

UserReferralSchema.plugin(mongoosePaginate);

UserReferralSchema.plugin(AggregatePaginate);

module.exports = mongoose.model("User_Referral", UserReferralSchema);
