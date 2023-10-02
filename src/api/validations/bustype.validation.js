const Joi = require("joi");
const { objectId } = require("./custom.validation");



const listBusTypes = {
  query: Joi.object().keys({
    global_search:Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    name: Joi.string(),
    status: Joi.boolean(),
    seat_numbers:Joi.string(),
    layout:Joi.string()
  }).unknown()
}

const createBusTypes = {
  body: Joi.object().keys({
    name: Joi.string(),
    status: Joi.string(),
  }),
};


const replaceBusTypes = {
  params: Joi.object().keys({
    bustypeId: Joi.string()
    .regex(/^[a-fA-F0-9]{24}$/)
    .required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      status: Joi.boolean(),
      seat_numbers:Joi.string(),
      layout:Joi.string()
    }),
};


const updateBusTypes = {
  params: Joi.object().keys({
    bustypeId: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      status: Joi.boolean(),
      id:Joi.string(),
    }),
};

const deleteBusTypes = {
  params: Joi.object().keys({
    bustypeId: Joi.string().custom(objectId),
  }),
};


const getBusTypes = {
  params: Joi.object().keys({
    bustypeId: Joi.string().custom(objectId),
  }),
};



module.exports = {

  // GET /v1/bustypes
  listBusTypes,
  getBusTypes,
  // POST /v1/bustypes
  createBusTypes,
  // PUT /v1/users/:userId
  replaceBusTypes,

  // PATCH /v1/bustypes/:bustypeId
  updateBusTypes,
  deleteBusTypes,
};
