const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const paginateAggregate = require('mongoose-aggregate-paginate-v2');
const objectIdToTimestamp = require("objectid-to-timestamp");
const { env, FULLBASEURL } = require("../../config/vars");


const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, default: "", index: true },
    lastname: { type: String, default: "", index: true },
    gender: { type: String,enum:['Male','Female','Other'], default: "Male", index: true },
    email: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      default: "",
      index: true,
    },
    country_code:{type:String,default:"91"},
    password: {
      type: String,
      minlength: 8,
    },
    home_address: {
      type: String,
    },
    otp: {
      type: Number,
      default: 0,
    },
    device_token: { type: String, default: "", index: true },
    device_type: { type: Number,enum:[1,2], default: 1, index: true }, // 1 === android , 2 === ios
    refercode: {
      type: String,
      trim: true,
      unique: true,
      index: true,
    },
    referedby: {
      type: String,
      trim: true,
    },
    ProfilePic: { type: String,default:"default.jpg" },
    language:{type:String,enum:["en","ar"],default:"en"},
    is_deleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    places: {
      home: {
        address: { type: String, default: "", index: true },
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], default: [] },
        timing: { type: Date, default: "" },
      },
      office: {
        address: { type: String, default: "", index: true },
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], default: [] },
        timing: { type: Date, default: "" },
      },
    },
  },
  { timestamps: true }
);


userSchema.virtual('fullname').get(function () {
  return [this.firstname, this.lastname].filter(Boolean).join(' ');
});

userSchema.pre("save", function (next) {
  let user = this;

  if (!user.isModified("password")) {
    return next();
  }

  bcrypt
    .genSalt(12)
    .then((salt) => {
      return bcrypt.hash(user.password, salt);
    })
    .then((hash) => {
      user.password = hash;
      next();
    })
    .catch(err => next(err));
});

userSchema.virtual("wallets", {
  ref: "Wallet", // the model to use
  localField: "_id", // find children where 'localField'
  foreignField: "users", // is equal to foreignField
  justOne: true,
});

userSchema.statics = {
  formatedSingleData(user) {
    if (!user.is_deleted) {
      return {
        firstname: user.firstname,
        lastname: user.lastname,
        gender: user.gender,
        email: user.email,
        phone: user.phone,
        // mode: user.mode,
        id: user._id,
        refercode: user.refercode,
        // ProfilePic: profilelink,
        // wallet_balance:
        //   user.wallets && parseFloat(user.wallets.amount) > 0
        //     ? user.wallets.amount.toString()
        //     : "0",
        // home_address: user.places ? user.places.home.address : "",
        // home_lat: user.places ? user.places.home.coordinates[1] : "",
        // home_lng: user.places ? user.places.home.coordinates[0] : "",
        // home_timing: user.places
        //   ? moment(user.places.home.timing).tz(DEFAULT_TIMEZONE).format("hh:mm a")
        //   : "",
        // office_timing: user.places
        //   ? moment(user.places.office.timing).tz(DEFAULT_TIMEZONE).format("hh:mm a")
        //   : "",
        // office_address: user.places ? user.places.office.address : "",
        // office_lat: user.places ? user.places.office.coordinates[1] : "",
        // office_lng: user.places ? user.places.office.coordinates[0] : "",
        status: user.status,
      };
    }
  },
  transformData: (data) => {
    const selectableItems = [];
    let i = 1;
    var profilelink = "";
    data.forEach((item) => {
      if (item.ProfilePic) {
        const regex =
          /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        if (regex.test(item.ProfilePic)) {
          profilelink = item.ProfilePic;
        } else {
          profilelink = `${process.env.BASE_URL}${item.ProfilePic}`;
        }
      } else {
        profilelink = "";
      }

      selectableItems.push({
        id: i++,
        ids: item.id,
        fullname: item.firstname + " " + item.lastname,
        gender: item.gender,
        email: item.email,
        phone: item.phone,
        mode: item.mode,
        social_id: item.social_id,
        refercode: item.refercode,
        ProfilePic: profilelink, //`${process.env.BASE_URL}
        wallet_balance:
          item.wallets && parseFloat(item.wallets.amount) > 0
            ? item.wallets.amount.toString()
            : "0",
        walletId:(item.wallets) ? item.wallets._id: null,
        home_address: item.places ? item.places.home.address : "",
        home_lat: item.places ? item.places.home.coordinates[1] : "",
        home_lng: item.places ? item.places.home.coordinates[0] : "",
        home_timing: item.places
          ? moment(item.places.home.timing).tz(DEFAULT_TIMEZONE).format("hh:mm a")
          : "",
        office_timing: item.places
          ? moment(item.places.office.timing)
              .tz(DEFAULT_TIMEZONE)
              .format("hh:mm a")
          : "",
        office_address: item.places ? item.places.office.address : "",
        office_lat: item.places ? item.places.office.coordinates[1] : "",
        office_lng: item.places ? item.places.office.coordinates[0] : "",
        status: item.status == true ? "Active" : "Inactive",
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_DATEFORMAT),
      });
    });
    return selectableItems;
  },
  formatUser(data) {
    const selectableItems = [];
    data.forEach((item) => {
      const picture = item.picture ? item.picture : 'default.jpg';
        selectableItems.push({
            id: item._id,
            pageid: objectIdToTimestamp(item._id),
            title: item.firstname + ' ' + item.lastname,
            country_code:item.country_code,
            phone:item.phone,
            picture:this.isValidURL(item.picture)
                ? item.picture
                : `${FULLBASEURL}public/users/profiles/` + picture
 
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

userSchema.plugin(paginateAggregate);



module.exports = mongoose.model("User", userSchema);
