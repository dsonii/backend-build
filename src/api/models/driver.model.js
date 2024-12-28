const mongoose = require("mongoose");
const { omitBy, isNil } = require("lodash");
const bcrypt = require("bcryptjs");
const { env, FULLBASEURL } = require("../../config/vars");
const moment = require("moment-timezone");
const paginateAggregate = require("mongoose-aggregate-paginate-v2");
const objectIdToTimestamp = require("objectid-to-timestamp");
/**
 * Driver Schema
 * @private
 */
const driverSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    currentLocation: {
      type: { type: String, default: "Point" },
      address: { type: String, default: "" },
      coordinates: {
        type: [Number], // An array of [longitude, latitude] coordinates
        default: [0, 0], // Default coordinates [0, 0]
      },
    },
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
    country_code: { type: String, default: "91" },
    type: { type: String, enum: ["driver", "assistant"], default: "assistant" },
    device_token: { type: String, default: "", index: true },
    device_type: { type: Number, enum: [1, 2], index: true, default: 1 }, // 1 === android 2 === ios
    is_deleted: { type: Boolean, default: false },
    national_id: { type: String, default: "" },
    licence_expiry_date: { type: Date },
    police_vertification_expiry_date:  { type: Date },
    picture: {
      type: String,
      trim: true,
      default: "default.jpg",
    },
    language: { type: String, enum:["en","ar"], default: "en" },
    document_licence: { type: String, default: "default.jpg" },
    document_adhar_card: {
      type: String,
      default: "default.jpg",
    },
    document_police_vertification: {
      type: String,
      default: "default.jpg",
    },
    status: { type: Boolean, default: false },
    duty_status: {
      type: String,
      enum: ["ONLINE", "TRACKING", "OFFLINE"],
      default: "OFFLINE",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
driverSchema.pre("save", async function save(next) {
  try {
    // if (!this.isModified('password')) return next();

    const rounds = env === "test" ? 1 : 10;

    const hash = await bcrypt.hash(this.phone, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
driverSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "adminId",
      "firstname",
      "lastname",
      "country_code",
      "phone",
      "type",
      "email",
      "picture",
      "document_police_vertification",
      "document_adhar_card",
      "document_licence",
      "status",
      "duty_status",
      "licence_expiry_date",
      "police_vertification_expiry_date",
      "createdAt",
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  },
});

/**
 * Statics
 */
driverSchema.statics = {
  /**
   * Get driver
   *
   * @param {ObjectId} id - The objectId of driver.
   * @returns {Promise<User, APIError>}
   */
  // asyncget(id) {
  //     try {
  //         let driver;

  //         if (mongoose.Types.ObjectId.isValid(id)) {
  //             driver = await this.findById(id).exec();
  //         }
  //         if (driver) {
  //             return driver;
  //         }

  //         throw new APIError({
  //             message: "User does not exist",
  //             status: httpStatus.NOT_FOUND,
  //         });
  //     } catch (error) {
  //         throw error;
  //     }
  // },

  /**
   * Find driver by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of driver.
   * @returns {Promise<User, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email) {
      throw new APIError({
        message: "An email is required to generate a token",
      });
    }

    const driver = await this.findOne({
      email,
    }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (password) {
      if (driver && (await driver.passwordMatches(password))) {
        return {
          driver,
          accessToken: driver.token(),
        };
      }
      err.message = "Incorrect email or password";
    } else if (refreshObject && refreshObject.driverEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = "Invalid refresh token.";
      } else {
        return {
          driver,
          accessToken: driver.token(),
        };
      }
    } else {
      err.message = "Incorrect email or refreshToken";
    }
    throw new APIError(err);
  },

  /**
   * List drivers in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of drivers to be skipped.
   * @param {number} limit - Limit number of drivers to be returned.
   * @returns {Promise<User[]>}
   */
  list({ page = 1, perPage, firstname, lastname, email, phone }) {
    const options = omitBy(
      {
        firstname,
        lastname,
        email,
        phone,
      },
      isNil
    );

    return this.find(options)
      .sort({
        createdAt: -1,
      })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },
  formatDriver(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: item._id,
        pageid: objectIdToTimestamp(item._id),
        title: item.firstname + " " + item.lastname,
        country_code: item.country_code,
        phone: item.phone,
        picture: this.isValidURL(item.picture)
          ? item.picture
          : `${FULLBASEURL}public/drivers/profiles/` + item.picture,
      });
    });
    return selectableItems;
  },
  transformData(rows) {
    const selectableItems = [];
    let i = 1;
    rows.forEach((item) => {
      if (item.adminId) {
        selectableItems.push({
          id: i++,
          ids: item.id,
          agent_name: item.adminId.firstname + " " + item.adminId.lastname,
          firstname: item.firstname,
          lastname: item.lastname,
          email: item.email,
          country_code: item.country_code,
          phone: item.phone,
          type: item.type,
          licence_expiry_date: item.licence_expiry_date,
          police_vertification_expiry_date: item.police_vertification_expiry_date,
          picture: this.isValidURL(item.picture)
            ? item.picture
            : `${FULLBASEURL}public/drivers/profiles/` + item.picture,
          document_licence: this.isValidURL(item.document_licence)
            ? item.document_licence
            : `${FULLBASEURL}` + item.document_licence,
          document_adhar_card: this.isValidURL(item.document_adhar_card)
            ? item.document_adhar_card
            : `${FULLBASEURL}` + item.document_adhar_card,
          document_police_vertification: this.isValidURL(
            item.document_police_vertification
          )
            ? item.document_police_vertification
            : `${FULLBASEURL}` + item.document_police_vertification,
          status: item.status == true ? "Active" : "Inactive",
          createdAt: moment
            .utc(item.createdAt)
            .tz(DEFAULT_TIMEZONE)
            .format(DEFAULT_DATEFORMAT),
        });
      }
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
    if (error.name === "MongoError" && error.code === 11000) {
      return new APIError({
        message: "Validation Error",
        errors: [
          {
            field: "email",
            location: "body",
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
};

driverSchema.plugin(paginateAggregate);

driverSchema.index({ location: "2dsphere" });

/**
 * @typedef Driver
 */
module.exports = mongoose.model("Driver", driverSchema);
