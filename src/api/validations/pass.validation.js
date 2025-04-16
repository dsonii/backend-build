const Joi = require('joi');
const { objectId } = require('./custom.validation');

const listPass = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    // no_of_rides: Joi.number(),
    // no_of_valid_days: Joi.string(),
    // price_per_km: Joi.string(),
    // discount: Joi.string(),
    // terms: Joi.string(),
    // description: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};

const createPass = {
  body: Joi.object().keys({
    no_of_rides: Joi.number(),
    no_of_valid_days: Joi.string(),
    price_per_km: Joi.string(),
    discount: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};

const getPass = {
  params: Joi.object().keys({
    passId: Joi.string().custom(objectId),
  }),
};
const deletePass = {
  params: Joi.object().keys({
    passId: Joi.string().custom(objectId),
  }),
};

const updatePass = {
  params: Joi.object().keys({
    passId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      code: Joi.string(),
      status: Joi.boolean(),
    })
    .unknown()
    .min(1),
};

module.exports = {
  // GET /v1/route
  listPass,
  getPass,
  // POST /v1/route
  createPass,
  // PATCH /v1/route/:routeId
  updatePass,
  deletePass,
};
