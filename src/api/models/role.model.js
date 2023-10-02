const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');
const mongoosePaginate = require('mongoose-paginate-v2');
const Permission = require('./permission.model');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require('moment-timezone');

const RoleSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, index: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  },
  { timestamps: true },
);

RoleSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'name', 'slug', 'permissions', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

RoleSchema.statics = {
  async get(slug) {
    const role = await this.findOne({ slug }, 'slug').lean();
    return role.slug;
  },
  getRole(roleId) { return this.findById(roleId).select('slug'); },
  getRoles() { return this.find().select('name slug').exec(); },
  getPermission(roleId) {
    return this.findById(roleId).populate('permissions').exec();
  },
  getAllRoles() { return this.find().populate('permissions').lean().exec(); },
  transformOptions(data) {
    const selectableItems = [];
    const i = 1;
    data.forEach((item) => {
      selectableItems.push({
        value: item.slug,
        text: item.name,
      });
    });
    return selectableItems;
  },
  async transformSingleData(item) {
    const permissions = await Permission.fetch(item.permissions);
    return {
      id: item._id,
      name: item.name,
      slug: item.slug,
      permissions,
    };
  },
  transformData: (data) => {
    const selectableItems = [];
    let i = 1;
    data.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item.id,
        name: item.name,
        slug: item.slug,
        permissions: item.permissions,
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_DATEFORMAT),
      });
    });
    return selectableItems;
  },

};

// RoleSchema.statics.getPermission = async (roleId) => {
//   try {
//     return await this.findOne({ _id: roleId }).populate('permissions').exec();
//   } catch (err) {
//     console.log(err);
//     return err;
//   }
// };

RoleSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Role', RoleSchema);
