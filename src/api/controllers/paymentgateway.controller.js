const paymentGateway = require("../models/paymentGateway.model");
const httpStatus = require("http-status");

/**
 *  update payment is enabled
 * @public
 */
exports.isEnabled = async (req, res, next) => {
  try {
    const getPaymentGateway = await paymentGateway.findOne({
      is_enabled: "1",
    });

    if (getPaymentGateway) {
      res.status(httpStatus.OK);
      res.json({
        message: `Please disabled the payment gateway ${getPaymentGateway.site} first.`,
        status: false,
      });
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: "",
        status: true,
      });
    }
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 *  update payment settings
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const getPaymentGateway = await paymentGateway.find({
      site: req.params.site,
    });
    const convertedObject = {};

    getPaymentGateway.forEach((item) => {
      convertedObject[item.name] = item.value.replace(/./g, '*');
    });
    res.status(httpStatus.OK);
    res.json({
      message: `payment setting fetched successfully.`,
      data: convertedObject,
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 *  update payment settings
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const {
      is_enabled,
      mode,
      currency,
      username,
      password,
      key,
      secret,
      integration_id,
      frame_id,
    } = req.body;
    const getPaymemtSetting = await paymentGateway.findOne({
      name: "is_enabled",
      value: "1",
    });
  
    if (getPaymemtSetting && getPaymemtSetting.site != req.params.site && is_enabled == "1") {
      res.status(httpStatus.OK);
      res.json({
        message: `Please disabled the payment gateway ${getPaymemtSetting.site} first.`,
        status: false,
      });
    } else {
      let update = {};
      if (req.params.site === "Razorpay") {
        await paymentGateway.updateOne(
          { site: req.params.site, name: "is_enabled" },
          { $set: { value: is_enabled ? "1" : "0" } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "mode" },
          { $set: { value: mode } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "key" },
          { $set: { value: key } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "secret" },
          { $set: { value: secret } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "currency" },
          { $set: { value: currency } }
        );
      } else if (req.params.site === "Paystack") {
        await paymentGateway.updateOne(
          { site: req.params.site, name: "is_enabled" },
          { $set: { value: is_enabled ? "1" : "0" } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "mode" },
          { $set: { value: mode } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "key" },
          { $set: { value: key } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "secret" },
          { $set: { value: secret } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "currency" },
          { $set: { value: currency } }
        );
      } else if (req.params.site === "Paymob") {
        await paymentGateway.updateOne(
          { site: req.params.site, name: "is_enabled" },
          { $set: { value: is_enabled ? "1" : "0" } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "mode" },
          { $set: { value: mode } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "key" },
          { $set: { value: key } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "secret" },
          { $set: { value: secret } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "username" },
          { $set: { value: username } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "password" },
          { $set: { value: password } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "integration_id" },
          { $set: { value: integration_id } }
        );
        await paymentGateway.updateOne(
          { site: req.params.site, name: "frame_id" },
          { $set: { value: frame_id } }
        );
      }
      res.status(httpStatus.OK);
      res.json({
        message: `Payment gateway ${req.params.site} updated successfully.`,
        status: true,
      });
    }
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};
