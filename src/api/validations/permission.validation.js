const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createPermission = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const updatePermission = {
  params: Joi.object().keys({
    permissionId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().required(),
    })
    .min(1),
};


module.exports = {
  createPermission,
  updatePermission,
};
