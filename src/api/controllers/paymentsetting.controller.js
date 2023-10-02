const paymentSetting = require("../models/paymentSetting.model");
const httpStatus = require("http-status");

/**
 *  update payment settings
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const getPaymemtSetting = await paymentSetting.find({status: true});

    res.status(httpStatus.OK);
    res.json({
      message: `payment setting fetched successfully.`,
      data: await paymentSetting.formatData(getPaymemtSetting),
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
      status,
      info_status,
      mode,
      merchant_id,
      username,
      password,
      key,
      secret,
      callback_url,
      webhook_url,
    } = req.body;
    const getPaymemtSetting = await paymentSetting.findOne({
      name: req.params.name,
      status: true,
    });
    if (getPaymemtSetting) {
      update = {
        info: {
          status:info_status,
          mode,
          merchant_id,
          username,
          password,
          key,
          secret,
          callback_url,
          webhook_url,
        },
      };

      await paymentSetting.findByIdAndUpdate(getPaymemtSetting._id, update);
      res.status(httpStatus.OK);
      res.json({
        message: `payment setting ${req.params.name} updated successfully.`,
        status: true,
      });
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: `payment settings ${req.params.name} not found     n cg cvnnnncnbbvbn.`,
        status: false,
      });
    }
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};
