const Joi = require('joi');
const { objectId } = require('./custom.validation');

const list = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    name: Joi.string(),
    code: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};

const create = {
  body: Joi.object().keys({
    name: Joi.string(),
    code: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};

const get = {
  params: Joi.object().keys({
    countryId: Joi.string().custom(objectId),
  }),
};
const remove = {
  params: Joi.object().keys({
    countryId: Joi.string().custom(objectId),
  }),
};

const update = {
  params: Joi.object().keys({
    countryId: Joi.required().custom(objectId),
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
  list,
  get,
  // POST /v1/route
  create,
  // PATCH /v1/route/:routeId
  update,
  remove,
};
