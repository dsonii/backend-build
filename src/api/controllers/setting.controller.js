const httpStatus = require("http-status");
const Setting = require("../models/setting.model");
const uuidv4 = require("uuid/v4");
const s3 = require("../../config/s3");
const {
  fileUpload,
  imageDelete,
  uploadLocal,
} = require("../services/uploaderService");
const { getFirstLetters } = require("../helpers/validate");
const path = require("path");
const fs = require("fs");

/**
 * Get application settings
 * @public
 */
exports.fetch = async (req, res) => {
  try {
    const settings = await Setting.findOne({}).sort({ _id: -1 });
    res.status(httpStatus.OK);
    res.json({
      appName: settings.general.name,
      appShortName: getFirstLetters(settings.general.name),
      appLogo: settings.general.logo,
      appEmail: settings.general.email,
      appAddress: settings.general.address,
      appPhone: settings.general.phone,
      defaultCountry: settings.general.default_country,
      defaultCurrency: settings.general.default_currency,
      timezone: settings.general.timezone,
      dateFormat: settings.general.date_format,
      timeFormat: settings.general.time_format,
      maxDistance: settings.general.max_distance,
      prebookingTime: settings.general.prebooking_time,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get application settings
 * @public
 */
exports.get = async (req, res) => {
  try {
    const settings = await Setting.findOne({}).sort({ _id: -1 }).limit(1);
    res.status(httpStatus.OK);
    res.json({
      message: "setting fetched successfully.",
      data: Setting.transFormSingleData(settings, req.params.type),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create new application settings
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { type, general, sms, email, terms, payment, s3 } = req.body;

    if (type == "general") {
      const settingObject = {
        general: {
          name: general.name,
          logo: general.logo,
          email: general.email,
          address: general.address,
          phone: general.phone,
          timezone: general.timezone.tzCode,
          google_key: general.googlekey,
          tax: general.tax,
          fee: general.fee,
        },
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        data: setting,
        status: true,
      });
    } else if (type == "s3") {
      const settingObject = {
        is_production: s3.is_production,
        access_key: s3.access_key,
        secret_key: s3.secret_key,
        region: s3.region,
        bucket: s3.bucket,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting,
        status: true,
      });
    } else if (type == "email") {
      const settingObject = {
        is_production: email.is_production,
        type: email.type,
        username: email.username,
        host: email.host,
        password: email.password,
        port: email.port,
        encryption: email.encryption,
        email: email.email,
        name: email.name,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting.email,
        status: true,
      });
    } else if (type == "sms") {
      const settingObject = {
        is_production: sms.is_production,
        senderId: sms.senderId,
        username: email.username,
        password: email.password,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting.sms,
        status: true,
      });
    } else if (type == "terms") {
      const settingObject = {
        terms,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting.terms,
        status: true,
      });
    } else if (type == "refunds") {
      const settingObject = {
        refunds,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "refunds created successfully.",
        location: setting.terms,
        status: true,
      });
    } else if (type == "payment") {
      const settingObject = {
        is_production: payment.is_production,
        key: payment.key,
        secret: payment.secret,
        text_name: payment.text_name,
        payment_capture: payment.payment_capture,
        logo: payment.logo,
        contact: payment.contact,
        email: payment.email,
        theme_color: payment.theme_color,
        currency: payment.currency,
        name: payment.name,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting.terms,
        status: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing Setting
 * @public
 */
exports.updateNotificationSetting = async (req, res, next) => {
  try {
    const {
      type,
      apple_key_id,
      apple_team_id,
      firebase_database_url,
      otp_validation_via,
    } = req.body;

    const settingObject = {
      notifications: {
        otp_validation_via,
        firebase_database_url,
        apple_key_id,
        apple_team_id,
      },
    };
    const FolderName = process.env.S3_BUCKET_SETTINGS;
    const settingexists = await Setting.findById(req.params.settingId).exec();
    let appleFile = req.files.apple_key;
    if (appleFile) {
      let uploadApplePath = path.join(
        __dirname,
        "../../api/services/files",
        appleFile.name
      );

      if (settingexists && settingexists.apple_key != "") {
        // await imageDelete(settingexists.notifications.apple_key, FolderName);
        await appleFile.mv(uploadApplePath);
        settingObject.notifications.apple_key = appleFile.name;
      } else {
        /** settingObject.notifications.apple_key = await fileUpload(
				req.files.apple_key,
				uuidv4(),
				FolderName
			  ); **/
        await appleFile.mv(uploadApplePath);
        settingObject.notifications.apple_key = appleFile.name;
      }
    }

    let firebaseFile = req.files.firebase_key;
    if (firebaseFile) {
      let uploadPath = path.join(
        __dirname,
        "../../api/services/files",
        firebaseFile.name
      );
      let firebaseRawdata = fs.readFileSync(uploadPath);
      settingObject.notifications.firebase_credential =
        JSON.parse(firebaseRawdata);

      if (settingexists && settingexists.firebase_key != "") {
        await firebaseFile.mv(uploadPath);
        settingObject.notifications.firebase_key = firebaseFile.name;
      } else {
        //settingObject.notifications.firebase_key = await fileUpload(
        //   req.files.firebase_key,
        //  uuidv4(),
        //  FolderName
        //);
        await firebaseFile.mv(uploadPath);
        settingObject.notifications.firebase_key = firebaseFile.name;
      }
    }

    // console.log('general.logo',general.logo);
    await Setting.findByIdAndUpdate(
      req.params.settingId,
      {
        $set: settingObject,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "notifications updated successfully.",
      status: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Update existing Setting
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const {
      type,
      general,
      sms,
      smtp,
      terms,
      payments,
      s3,
      notifications,
      refunds,
      refferal,
      referral_policy,
    } = req.body;

    // console.log("type", type);
    const isProductionS3 = await Setting.gets3();

    const FolderName = process.env.S3_BUCKET_SETTINGS;
    if (type == "general") {
      const settingObject = {
        general: {
          name: general.name,
          email: general.email,
          address: general.address,
          phone: general.phone,
          timezone: general.timezone
            ? general.timezone
            : general.timezone.tzCode,
          default_country: general.default_country,
          default_currency: general.default_currency,
          date_format: general.date_format,
          time_format: general.time_format,
          google_key: general.google_key,
          fee: general.fee,
          tax: general.tax,
          api_base_url: general.api_base_url,
          background_location_update_interval:
            general.background_location_update_interval,
          driver_online_location_update_interval:
            general.driver_online_location_update_interval,
          max_distance: general.max_distance,
          prebooking_time: general.prebooking_time,
        },
      };
      if (general.logo != "" && await Setting.isValidBase64(general.logo)) {
        if (isProductionS3.is_production) {
          settingObject.general.logo = await Setting.logoUpdate(
            req.params.settingId,
            general.logo,
            FolderName,
            type
          ); // upload logo
        } else {
          // if is_production is false
          settingObject.general.logo = await uploadLocal(
            general.logo,
            FolderName
          );
        }
      }

      // console.log('general.logo',general.logo);
      const updatesettings = await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );

      res.json({
        message: "settings updated successfully.",
        data: {
          appName: updatesettings.general.name,
          appShortName: getFirstLetters(updatesettings.general.name),
          appLogo: updatesettings.general.logo,
          appEmail: updatesettings.general.email,
          appAddress: updatesettings.general.address,
          appPhone: updatesettings.general.phone,
          timezone: updatesettings.general.timezone,
          dateFormat: updatesettings.general.date_format,
          timeFormat: updatesettings.general.time_format,
          defaultCountry: updatesettings.general.default_country,
          defaultCurrency: updatesettings.general.default_currency,
        },
        status: true,
      });
    } else if (type == "aws") {
      const settingObject = {
        s3: {
          is_production: s3.is_production,
          access_key: s3.access_key,
          secret_key: s3.secret_key,
          region: s3.region,
          bucket: s3.bucket,
        },
      };
      const updatesettings = await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );

      const transformedUsers = Setting.transFormSingleData(
        updatesettings,
        type
      );
      res.json({
        message: "s3 settings updated successfully.",
        data: transformedUsers,
        status: true,
      });
    } else if (type == "smtp") {
      const settingObject = {
        smtp: {
          is_production: smtp.is_production,
          type: smtp.type,
          username: smtp.username,
          host: smtp.host,
          password: smtp.password,
          port: smtp.port,
          encryption: smtp.encryption,
          email: smtp.email,
          name: smtp.name,
        },
      };
      const updatesettings = await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );

      const transformedUsers = Setting.transFormSingleData(
        updatesettings,
        type
      );
      res.json({
        message: "settings updated successfully.",
        data: transformedUsers,
        status: true,
      });
    } else if (type == "sms") {
      const settingObject = {
        sms: {
          is_production: sms.is_production,
          senderId: sms.senderId,
          username: sms.username,
          password: sms.password,
          apiKey: sms.apikey,
        },
      };
      const updatesettings = await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );

      const transformedUsers = Setting.transFormSingleData(
        updatesettings,
        type
      );
      res.json({
        message: "settings updated successfully.",
        data: transformedUsers,
        status: true,
      });
    } else if (type == "notifications") {
      apple_key_URL = "";
      if (notifications.apple_key != "") {
      }

      const settingObject = {
        notifications: {
          customer_secret_key: notifications.customer_secret_key,
          driver_secret_key: notifications.driver_secret_key,
          apple_key_id: notifications.apple_key_id,
          apple_team_id: notifications.apple_team_id,
          apple_key: apple_key_URL,
        },
      };

      const updatesettings = await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );

      const transformedUsers = Setting.transFormSingleData(
        updatesettings,
        type
      );
      res.json({
        message: "settings updated successfully.",
        data: transformedUsers,
        status: true,
      });
    } else if (type == "terms") {
      const settingObject = {
        terms,
      };
      const updatesettings = await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );

      const transformedUsers = Setting.transFormSingleData(
        updatesettings,
        type
      );
      res.json({
        message: "settings updated successfully.",
        data: transformedUsers,
        status: true,
      });
    } else if (type == "refunds") {
      const settingObject = {
        refunds: {
          type: refunds.type,
          amount: refunds.amount,
          minimum_time: refunds.minimum_time,
          contents: refunds.contents,
        },
      };
      const updatesettings = await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );

      const transformedUsers = Setting.transFormSingleData(
        updatesettings,
        type
      );
      res.json({
        message: "refunds updated successfully.",
        data: transformedUsers,
        status: true,
      });
    } else if (type == "refferal") {
      const settingObject = {
        refferal: refferal,
      };

      await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );
      res.json({
        message: "settings refferal updated successfully.",
        status: true,
      });
    } else if (type === "referral_policy") {
      const settingObject = {
        referral_policy,
      };

      await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );
      res.json({
        message: "settings refferal updated successfully.",
        status: true,
      });
    } else if (type == "payments") {
      const settingObject = {
        payments: {
          is_production: payments.is_production,
          key: payments.key,
          secret: payments.secret,
          text_name: payments.text_name,
          payment_capture: payments.payment_capture,
          contact: payments.contact,
          email: payments.email,
          theme_color: payments.theme_color,
          currency: payments.currency,
          name: payments.name,
        },
      };
      settingObject.payments.logo = await Setting.logoUpdate(
        req.params.settingId,
        payments.logo,
        FolderName,
        type
      ); // upload logo
      const updatesettings = await Setting.findByIdAndUpdate(
        req.params.settingId,
        {
          $set: settingObject,
        },
        {
          new: true,
        }
      );

      const transformedUsers = Setting.transFormSingleData(
        updatesettings,
        type
      );
      res.json({
        message: "settings updated successfully.",
        data: transformedUsers,
        status: true,
      });
    }
  } catch (error) {
    next(error);
  }
};
