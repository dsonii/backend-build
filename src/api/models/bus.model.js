const mongoose = require("mongoose");
const { Schema } = mongoose;
//const moment = require("moment-timezone");
const { ObjectId } = Schema;
const httpStatus = require("http-status");
const { omitBy, isNil } = require("lodash");
const APIError = require("../utils/APIError");
const paginateAggregate = require('mongoose-aggregate-paginate-v2');
const moment = require('moment-timezone');
/**
 * Bus Schema
 * @private
 */
const busSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
    },
    bustypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bus_Type",
        required: true,
    },
    buslayoutId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bus_Layout"
    },
    code: { type: String, default: 'B007' },
    name: {
        type: String,
        index: true,
        default: "",
    },
    reg_no: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    brand: {
        type: String,
        index: true,
        default: ''
    },
    model_no: {
        type: String,
        index: true,
        default: '',
    },
    chassis_no: {
        type: String,
        index: true,
        default: '',
    },
    picture: {
        type: String,
    },
    amenities: { type: [String], default: '', index: true },
    certificate_registration: { type: String },
    certificate_pollution: { type: String },
    certificate_insurance: { type: String },
    certificate_fitness: { type: String },
    certificate_permit: { type: String },
    status: { type: Boolean, default: true },
}, {
    timestamps: true,
});



busSchema.method({
    transform() {
        const transformed = {};
        const fields = [
            "id",
            "reg_no",
            "name",
            "brand",
            "model_no",
            "chassis_no",
            "picture",
            "amenities",
            "certificate_registration",
            "certificate_pollution",
            "certification_insurance",
            "certificate_fitness",
            "certificate_permit",
            "status",
            "createdAt",
        ];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });

        return transformed;
    },
});



// busSchema.virtual('admins', {
//   ref: 'Admin', // the model to use
//   localField: '_id', // find children where 'localField'
//   foreignField: 'adminId', // is equal to foreignField
//   justOne: true,
// });


// busSchema.virtual('bustypes', {
//   ref: 'Bus_type', // the model to use
//   localField: '_id', // find children where 'localField'
//   foreignField: 'bustypeId', // is equal to foreignField
//   justOne: true,
// });



busSchema.statics = {
    list({
        page = 1,
        perPage = 30,
        firstname,
        lastname,
        email,
        role
    }) {
        const options = omitBy({}, isNil);

        return this.find(options)
            .sort({ createdAt: -1 })
            .skip(perPage * (page - 1))
            .limit(perPage)
            .exec();
    },
    transformOptions(data) {
        const selectableItems = [];
        const i = 1;
        data.forEach((item) => {
            selectableItems.push({
                value: item._id,
                text: item.name + ' - ' + item.buslayoutId.max_seats + ' seats'
            });
        });
        return selectableItems;
    },
    transformData(item) {
        return {
            id: item._id,
            name: item.name,
            reg_no: item.reg_no,
            brand: item.brand,
            model_no: item.model_no,
            chassis_no: item.chassis_no,
            type: (item.bustypeId) ? item.bustypeId.name : '',
            layout: (item.buslayoutId) ? item.buslayoutId.name : '',
            max_seats: (item.buslayoutId) ? item.buslayoutId.max_seats : '',
            bustypeId: item.bustypeId._id,
            buslayoutId: item.buslayoutId._id,
            adminId: item.adminId._id,
            created_by: (item.adminId) ? item.adminId.firstname : '',
            picture: item.picture,
            amenities: item.amenities,
            certificate_registration: item.certificate_registration,
            certificate_pollution: item.certificate_pollution,
            certificate_insurance: item.certificate_insurance,
            certificate_fitness: item.certificate_fitness,
            certificate_permit: item.certificate_permit,
            status: item.status,
            createdAt: moment.utc(item.createdAt).tz(DEFAULT_TIMEZONE).format(DEFAULT_DATEFORMAT),
        }
    },
    transformDataLists(data) {
        const selectableItems = [];
        let i = 1;
        data.forEach((item) => {
            selectableItems.push({
                id: i++,
                ids: item.id,
                name: item.name,
                reg_no: item.reg_no,
                brand: item.brand,
                model_no: item.model_no,
                chassis_no: item.chassis_no,
                type: (item.bustypeId) ? item.bustypeId.name : '',
                layout: (item.buslayoutId) ? item.buslayoutId.name : '',
                max_seats: (item.buslayoutId) ? item.buslayoutId.max_seats : '',
                created_by: (item.adminId) ? item.adminId.firstname : '',
                picture: item.picture,
                amenities: item.amenities,
                certificate_registration: item.certificate_registration,
                certificate_pollution: item.certificate_pollution,
                certificate_insurance: item.certificate_insurance,
                certificate_fitness: item.certificate_fitness,
                certificate_permit: item.certificate_permit,
                status: item.status == true ? "Active" : "Inactive",
                createdAt: moment.utc(item.createdAt).tz(DEFAULT_TIMEZONE).format("DD MMM YYYY"),
            });
        });
        return selectableItems;
    },
    isValidURL(str) {
        const regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        if (!regex.test(str)) {
            return false;
        }
        return true;
    },
    isValidBase64(str) {
        const regex = /^data:image\/(?:gif|png|jpeg|jpg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/g;

        if (regex.test(str)) {
            return true;
        }
        return false;
    },
};



busSchema.plugin(paginateAggregate);

module.exports = mongoose.model("Bus", busSchema);
