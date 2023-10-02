const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const APIError = require('../utils/APIError');
const {
  BASEURL,
  FULLBASEURL,
  port,
  env,
  jwtSecret,
  jwtExpirationInterval,
} = require('../../config/vars');
const paginateAggregate = require('mongoose-aggregate-paginate-v2');
const AdminDetail = require('../models/adminDetail.model');
/**
 * Admin Roles
 */
const roles = [
  'admin',
  'super-admin',
  'agent',
  'supervisor',
  'manager',
  'staff',
];

/**
 * Admin Schema
 * @private
 */
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 6,
      maxlength: 128,
    },
    firstname: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    lastname: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    services: {
      facebook: String,
      google: String,
    },
    role: {
      type: String,
      default: '',
    },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    picture: {
      type: String,
      trim: true,
      default: 'default.jpg',
    },
    is_active: { type: Boolean, default: false },
    last_login: { type: Date, default: new Date() },
  },
  {
    timestamps: true,
  },
);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
adminSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('password')) return next();

    const rounds = env === 'test' ? 1 : 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
adminSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      'id',
      'firstname',
      'lastname',
      'phone',
      'email',
      'picture',
      'role',
      'roleId',
      'city',
      'pincode',
      'is_agent',
      'commission',
      'company',
      'address_1',
      'address_2',
      'contact_no',
      'document_pan_card',
      'document_gst_certificate',
      'createdAt',
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  token() {
    const payload = {
      exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: this._id,
      type: 'Bearer',
      roleId: this.roleId,
    };
    return jwt.encode(payload, jwtSecret);  
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  },
});

adminSchema.virtual('admin_details', {
  ref: 'Admin_Detail', // the model to use
  localField: '_id', // find children where 'localField'
  foreignField: 'adminId', // is equal to foreignField
  justOne: true,
});


adminSchema.virtual('roles', {
  ref: 'Role', // the model to use
  localField: 'roleId', // find children where 'localField'
  foreignField: '_id', // is equal to foreignField
  justOne: true,
});

/**
 * Statics
 */
adminSchema.statics = {
  roles,

  /**
   * Get admin
   *
   * @param {ObjectId} id - The objectId of admin.
   * @returns {Promise<Admin, APIError>}
   */
  async get(id) {
    try {
      let admin;

      if (mongoose.Types.ObjectId.isValid(id)) {
        admin = await this.findById(id).populate(['admin_details', 'roles']).lean();
      }

      if (admin) {
        return admin;
      }

      throw new APIError({
        message: 'Admin does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find admin by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of admin.
   * @returns {Promise<Admin, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email) {
      throw new APIError({
        message: 'An email is required to generate a token',
      });
    }

    const admin = await this.findOne({ email }).exec();
    const admindetail = await AdminDetail.findOne({ adminId: admin._id });
    //  console.log('admindetail',admindetail);
    admin.city = admindetail.city;
    admin.is_agent = admindetail.is_agent;
    admin.company = admindetail.is_agent ? admindetail.company : '';
    admin.pincode = admindetail.is_agent ? admindetail.pincode : '';
    admin.document_pan_card = admindetail.is_agent
      ? admindetail.document_pan_card
      : '';
    admin.document_gst_certificate = admindetail.is_agent
      ? admindetail.document_gst_certificate
      : '';
    admin.contact_no = admindetail.is_agent ? admindetail.contact_no : '';
    admin.commission = admindetail.is_agent ? admindetail.commission : '';

    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (password) {
      if (admin && (await admin.passwordMatches(password))) {
        return { admin, accessToken: admin.token() };
      }
      err.message = 'Incorrect password';
    } else if (refreshObject && refreshObject.userEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = 'Invalid refresh token.';
      } else {
        return { admin, accessToken: admin.token() };
      }
    } else {
      err.message = 'Incorrect email or refreshToken';
    }
    throw new APIError(err);
  },

  /**
   * List admins in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of admins to be skipped.
   * @param {number} limit - Limit number of admins to be returned.
   * @returns {Promise<Admin[]>}
   */
  list({
    page = 1, perPage = 30, firstname, lastname, email, role,
  }) {
    const options = omitBy(
      {
        firstname,
        lastname,
        email,
        role,
      },
      isNil,
    );

    return this.find(options)
      .populate('adminId')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },
  transformData(rows) {
    const selectableItems = [];
    let i = 1;

    console.log('rows', rows);
    rows.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item.id,
        firstname: item.firstname,
        lastname: item.lastname,
        email: item.email,
        phone: item.phone,
        role: item.role,
        picture: this.isValidURL(item.picture)
          ? item.picture
          : `${FULLBASEURL}${item.picture}`,
        address_1: item.admin_details.is_agent
          ? item.admin_details.address_1
          : '',
        address_2: item.admin_details.is_agent
          ? item.admin_details.address_2
          : '',
        city: item.admin_details.is_agent ? item.admin_details.city : '',
        contact_no: item.admin_details.is_agent
          ? item.admin_details.contact_no
          : '',
        pincode: item.admin_details.is_agent ? item.admin_details.pincode : '',
        company: item.admin_details.is_agent ? item.admin_details.company : '',
        is_agent: item.admin_details.is_agent,
        commission: item.admin_details.is_agent
          ? item.admin_details.commission
          : '',
        document_gst_certificate: this.isValidURL(item.admin_details.document_gst_certificate)
          ? item.admin_details.document_gst_certificate
          : `${FULLBASEURL}${item.admin_details.document_gst_certificate}`,
        document_pan_card: this.isValidURL(item.admin_details.document_pan_card)
          ? item.admin_details.document_pan_card
          : `${FULLBASEURL}${item.admin_details.document_pan_card}`,
        last_login: moment
          .utc(item.last_login)
          .tz(DEFAULT_TIMEZONE)
          .format('LLL'),
        is_active: item.is_active == true ? 'Active' : 'Inactive',
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_DATEFORMAT),
      });
    });
    return selectableItems;
  },
  isValidURL(str) {
    const regex =
      /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  },
  isValidBase64(str) {
    const regex =
      /^data:image\/(?:gif|png|jpeg|jpg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/g;

    if (regex.test(str)) {
      return true;
    }
    return false;
  },
  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [
          {
            field: 'email',
            location: 'body',
            messages: ['"email" already exists'],
          },
        ],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },

  async oAuthLogin({
    service, id, email, name, picture,
  }) {
    const admin = await this.findOne({
      $or: [{ [`services.${service}`]: id }, { email }],
    });
    if (admin) {
      admin.services[service] = id;
      if (!admin.name) admin.name = name;
      if (!admin.picture) admin.picture = picture;
      return admin.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id },
      email,
      password,
      name,
      picture,
    });
  },
};

adminSchema.plugin(paginateAggregate);
/**
 * @typedef Admin
 */
module.exports = mongoose.model('Admin', adminSchema);
