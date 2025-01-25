const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createBuses = {
  body: Joi.object().keys({
    bustypeId: Joi.string().custom(objectId),
    name: Joi.string().required(),
    reg_no: Joi.string().required(),
    model_no: Joi.string(),
    brand: Joi.string(),
    chassis_no: Joi.string(),
    max_seats: Joi.string(),
    status: Joi.boolean(),
    // certificate_registration: Joi.string(),
    // certificate_pollution: Joi.string(),
    // certification_insurance: Joi.string(),
    // certificate_fitness: Joi.string(),
    // certificate_permit: Joi.string(),
  }).unknown(),
};

const listBuses = {
  query: Joi.object().keys({
    // filters: Joi.string().default({}),
    // sort: Joi.string().default({}),
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    type: Joi.string(),
    name: Joi.string(),
    reg_no: Joi.string(),
    max_seats: Joi.string(),
    status: Joi.string(),

    // certificate_registration: Joi.string(),
    // certificate_pollution: Joi.string(),
    // certification_insurance: Joi.string(),
    // certificate_fitness: Joi.string(),
    // certificate_permit: Joi.string(),
  }).unknown(),
};

const updateBuses = {
  params: Joi.object().keys({
    busId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    bustypeId: Joi.string(),
    name: Joi.string(),
    reg_no: Joi.string(),
    model_no: Joi.string(),
    brand: Joi.string(),
    chassis_no: Joi.string(),
    max_seats: Joi.string(),
    status: Joi.boolean(),
    // certificate_registration: Joi.string(),
    // certificate_pollution: Joi.string(),
    // certification_insurance: Joi.string(),
    // certificate_fitness: Joi.string(),
    // certificate_permit: Joi.string(),
  }).unknown(),
};

const deleteBuses = {
  params: Joi.object().keys({
    busId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  // GET /v1/buses
  listBuses,
  // POST /v1/buses
  createBuses,
  // PATCH /v1/buses/:busId
  updateBuses,
  deleteBuses,
};
