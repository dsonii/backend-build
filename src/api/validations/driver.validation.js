const Joi = require('joi');
const { objectId } = require("./custom.validation");


const listDrivers = {
  query: Joi.object().keys({
    global_search:Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    firstname: Joi.string(),
    lastname: Joi.string(),
    phone: Joi.string(),
    email: Joi.string(),
    status: Joi.boolean(),
  }).unknown()
}



const createDriver = {
  body: Joi.object().keys({
    adminId: Joi.string().custom(objectId),
    email: Joi.string().email(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    phone: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};

const updateDriver = {
  params: Joi.object().keys({
    driverId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      adminId: Joi.string().custom(objectId),
      email: Joi.string().email(),
      firstname: Joi.string(),
      lastname: Joi.string(),
      phone: Joi.string(),
      status: Joi.boolean(),
    }).unknown()
    .min(1),
};


const deleteDriver = {
  params: Joi.object().keys({
    driverId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  // GET /v1/drivers
  listDrivers,
  // POST /v1/drivers
  createDriver,
  // PATCH /v1/drivers/:driverId
  updateDriver,
  deleteDriver
};
