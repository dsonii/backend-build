const Joi = require('joi');
const { objectId } = require('./custom.validation');


const listRoute = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    title: Joi.string(),
    status: Joi.string(),
  }).unknown(),
};


const createRoute = {
  body: Joi.object().keys({
    title: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};


const updateRoute = {
  params: Joi.object().keys({
    routeId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      status: Joi.boolean(),
    })
    .unknown()
    .min(1),
};


const deleteRoute = {
  params: Joi.object().keys({
    routeId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  // GET /v1/route
  listRoute,
  // POST /v1/route
  createRoute,
  // PATCH /v1/route/:routeId
  updateRoute,
  deleteRoute,
};
