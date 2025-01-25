const Joi = require('joi');
const { objectId } = require('./custom.validation');


const listBusLayouts = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    name: Joi.string(),
    status: Joi.boolean(),
    seat_numbers: Joi.string(),
    layout: Joi.string(),
  }).unknown(),
};

const createBusLayouts = {
  body: Joi.object().keys({
    name: Joi.string(),
    status: Joi.string(),
    seat_numbers: Joi.string(),
    layout: Joi.string(),
  }).unknown(),
};

const replaceBusLayouts = {
  params: Joi.object().keys({
    buslayoutId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      status: Joi.boolean(),
      seat_numbers: Joi.string(),
      layout: Joi.string(),
    }),
};

const updateBusLayouts = {
  params: Joi.object().keys({
    buslayoutId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      status: Joi.boolean(),
      seat_numbers: Joi.string(),
      layout: Joi.string(),
    }).unknown(),
};

const deleteBusLayouts = {
  params: Joi.object().keys({
    buslayoutId: Joi.string().custom(objectId),
  }),
};


module.exports = {

  // GET /v1/buslayouts
  listBusLayouts,
  replaceBusLayouts,
  // POST /v1/buslayouts
  createBusLayouts,
  // PATCH /v1/buslayouts/:buslayoutId
  updateBusLayouts,
  deleteBusLayouts,
};
