const Joi = require('joi');
const { objectId } = require('./custom.validation');


const listTimeTable = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    perPage: Joi.number().min(1).max(100),
    direction: Joi.string(),
    every: Joi.array(),
    time: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};


const createTimeTable = {
  body: Joi.object().keys({
    // routeId:Joi.object(),
    direction: Joi.string(),
    every: Joi.array(),
    time: Joi.string(),
    status: Joi.boolean(),
  }).unknown(),
};

const updateTimeTable = {
  params: Joi.object().keys({
    timetableId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      busId: Joi.string().custom(objectId),
      //  routeId:Joi.object(),
      direction: Joi.string(),
      every: Joi.array(),
      time: Joi.string(),
      status: Joi.boolean(),
    })
    .unknown()
    .min(1),
};

const deleteTimeTable = {
  params: Joi.object().keys({
    timetableId: Joi.string().custom(objectId),
  }),
};


module.exports = {

  // GET /v1/timetable
  listTimeTable,

  // POST /v1/timetable
  createTimeTable,
  // PATCH /v1/timetable/:timetableId
  updateTimeTable,
  deleteTimeTable,
};
