const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Schema } = mongoose;
const { ObjectId } = Schema;

/**
 * Admin Schema
 * @private
 */
const admindetailSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  company: { type: String, default: '' },
  address_1: { type: String, default: '' },
  address_2: { type: String, default: '' },
  city: { type:[Object],default:[{}] },
  pincode: { type: String, default: '' },
  contact_no: { type: String, default: '' },
  is_agent: { type: Boolean, default: false },
  document_gst_certificate: { type: String, default: 'public/documents/default.jpg' },
  document_pan_card: { type: String, default: 'public/documents/default.jpg' },
  commission: { type: Number, default: 0 },
}, {
  timestamps: true,
});


/**
 * Methods
 */
admindetailSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'adminId', 'company', 'address_1', 'address_2', 'city', 'pincode', 'is_agent', 'commission', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

/**
 * Statics
 */
admindetailSchema.statics = {


};
/**
 * @typedef Admin Detail
 */
module.exports = mongoose.model('Admin_Detail', admindetailSchema);
