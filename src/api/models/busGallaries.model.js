const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');

/**
 * Bus galleries Schema
 * @private
 */
const busGalleriesSchema = new mongoose.Schema({
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true,
    },
    image_url: {
        type: String
    },
    created_by: {
        type: String,
    },
    status: { type: Boolean, default: true },
}, {
    timestamps: true,
});

busGalleriesSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'busId', 'image_url', 'created_by', 'status'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

module.exports = mongoose.model('Bus_galleries', busGalleriesSchema);
