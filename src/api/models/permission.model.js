const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');
const mongoosePaginate = require('mongoose-paginate-v2');
const slug = require('slug');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const moment = require('moment-timezone');

const PermissionSchema = new Schema(
  {
    name: {
      type: String, unique: true, required: true, index: true,
    },
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true },
);


PermissionSchema.pre('save', function (next) {
  this.slug = slug(this.name, '.');
  next();
});

PermissionSchema.pre('findOneAndUpdate', async function (next) {
  const permissionToUpdate = await this.findOne(this.getQuery());
  this._update.slug = slug(permissionToUpdate.name, '.');
  next();
});


PermissionSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'name', 'slug', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

PermissionSchema.statics = {
  async get(slug) {
    const Permission = await this.findOne({ slug }, 'slug').lean();
    return Permission.slug;
  },
  async fetch(permissions) {
    const getPermissions = await this.find({ _id: { $in: permissions } }).lean();
    return await this.transformOptions(getPermissions);
  },
  transformOptions(data) {
    const selectableItems = [];
    const i = 1;
    data.forEach((item) => {
      selectableItems.push({
        code: item._id,
        name: item.name,
        slug: item.slug,
      });
    });
    return selectableItems;
  },
  transformSingleData(item) {
    return {
      id: item._id,
      name: item.name,
      slug: item.slug,
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
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_DATEFORMAT),
      });
    });
    return selectableItems;
  },
};

PermissionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Permission', PermissionSchema);
