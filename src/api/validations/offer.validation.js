const Joi = require('joi');
const { objectId } = require('./custom.validation');

const listOffer = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    status: Joi.boolean(),
  }).unknown(),
};

const createOffer = {
  body: Joi.object().keys({
    name: Joi.string(),
    code: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};

const updateOffer = {
  params: Joi.object().keys({
    offerId: Joi.required().custom(objectId),
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


const deleteOffer = {
  params: Joi.object().keys({
    offerId: Joi.string().custom(objectId),
  }),
};


module.exports = {
  // GET /v1/route
  listOffer,
  // POST /v1/route
  createOffer,
  // PATCH /v1/route/:routeId
  updateOffer,
  deleteOffer,
};
