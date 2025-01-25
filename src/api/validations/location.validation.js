const Joi = require('joi');
const { objectId } = require('./custom.validation');


const listLocations = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    firstname: Joi.string(),
    lastname: Joi.string(),
    phone: Joi.string(),
    email: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};

const createLocation = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    location: Joi.object(),
    city: Joi.string(),
    state: Joi.string(),
    satus: Joi.number(),
  }).unknown(),
};

const replaceLocation = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      location: Joi.object(),
      city: Joi.string(),
      state: Joi.string(),
      satus: Joi.number(),
    })
    .min(1),
};

const updateLocation = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().required(),
      location: Joi.object(),
      city: Joi.string(),
      state: Joi.string(),
      satus: Joi.number(),
    })
    .unknown()
    .min(1),
};

const deleteLocation = {
  params: Joi.object().keys({
    locationId: Joi.string().custom(objectId),
  }),
};


module.exports = {

  // GET /v1/locations
  listLocations,
  // POST /v1/locations
  createLocation,
  // PUT /v1/locations/:locationId
  replaceLocation,
  // PATCH /v1/locations/:locationId
  updateLocation,
  deleteLocation,
};
