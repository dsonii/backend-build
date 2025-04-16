const Joi = require("joi");
const { objectId } = require("./custom.validation");


const listAgent = {
  query: Joi.object().keys({
    global_search:Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    firstname: Joi.string(),
    lastname: Joi.string(),
    contact_no: Joi.string(),
    email: Joi.string()
  }).unknown()
};

const createAgent = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    city: Joi.string(),
    phone: Joi.string(),
    contact_no: Joi.string(),
    company:Joi.string(),
    is_active:Joi.boolean()
  }).unknown(),
};

const replaceAgent = {
  params: Joi.object().keys({
    adminId: Joi.string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .required(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email().required(),
      firstname: Joi.string(),
      lastname: Joi.string(),
      contact_no: Joi.string(),
      city: Joi.string(),
      phone: Joi.string(),
      is_active:Joi.boolean()
    })
    .min(1),
};

const updateAgent = {
  params: Joi.object().keys({
    adminId: Joi.string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .required(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      firstname: Joi.string(),
      lastname: Joi.string(),
      phone: Joi.string(),
      city: Joi.string(),
      contact_no: Joi.string(),
      company:Joi.string(),
      is_active:Joi.boolean()
    })
    .unknown()
    .min(1),
};

const deleteAgent = {
  params: Joi.object().keys({
    adminId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  // GET /v1/Agent
  listAgent,
  // POST /v1/Agent
  createAgent,
  // PUT /v1/Agent/:AgentId
  replaceAgent,
  // PATCH /v1/Agent/:AgentId
  updateAgent,
  deleteAgent
};
