const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const City = require("../models/city.model");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");

const uuidv4 = require("uuid/v4");


/**
 * Load user and append to req.
 * @public
 */
 exports.load = async (req, res, next) => {
  try {
    const city = await City.find({},'city').sort({city:1});
    res.status(httpStatus.OK);
    res.json({
      message: 'City load data.',
      data: City.transformOptions(city),
      status: true,
    });
  } catch (error) {
    return next(error);
  }
};
