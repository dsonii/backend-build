const mongoose = require('mongoose');
const Role = require('./role.model');

const { Schema } = mongoose;
const { ObjectId } = Schema;

const AdminRoleSchema = new Schema(
  {
    adminId: { type: ObjectId, ref: 'Admin', default: null },
    roleId: { type: ObjectId, ref: 'Role', default: null },
  },
  { timestamps: true },
);

AdminRoleSchema.statics.getUser = function (id) {
  return this.findOne({ adminId: id }).exec();
};

AdminRoleSchema.statics.getRelation = function () {
  return this.find().populate('roleId adminId').exec();
};

AdminRoleSchema.statics.getRole = async function (role) {
  return await Role.findOne({ _id: role }).select('slug').exec();
};
module.exports = mongoose.model('Admin_Role', AdminRoleSchema);
