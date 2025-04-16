const Joi = require('joi');
const { objectId } = require('./custom.validation');


const listRoles = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    // name: Joi.string()
  }).unknown(),
};


const createRoles = {
  body: Joi.object().keys({
    name: Joi.string(),
    slug: Joi.string(),
  }),
};


const updateRoles = {
  params: Joi.object().keys({
    roleId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      id: Joi.string().custom(objectId),
      name: Joi.string(),
      slug: Joi.string(),
    })
    .min(1),
};


const deleteRoles = {
  params: Joi.object().keys({
    roleId: Joi.string().custom(objectId),
  }),
};


module.exports = {
  // GET /v1/roles
  listRoles,
  // POST /v1/roles
  createRoles,
  // PUT /v1/users/:userId
  // PATCH /v1/roles/:roleId
  updateRoles,
  deleteRoles,
};
