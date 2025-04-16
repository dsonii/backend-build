const Joi = require('joi');
const { objectId } = require('./custom.validation');

const listNotification = {
  query: Joi.object().keys({
    global_search: Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    user_type: Joi.string(),
    schedule: Joi.string(),
    send_total: Joi.string(),
    time: Joi.string(),
    to: Joi.string(),
    days: Joi.string(),
  }).unknown(),
};


const createNotification = {
  body: Joi.object().keys({
    to: Joi.string(),
    days: Joi.array(),
    price_per_km: Joi.string(),
    user_type: Joi.string(),
    message_type: Joi.string(),
    schedule: Joi.string(),
  }).unknown(),
};

const getNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().custom(objectId),
  }),
};
const deleteNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().custom(objectId),
  }),
};

const updateNotification = {
  params: Joi.object().keys({
    notificationId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      to: Joi.string(),
      days: Joi.array(),
      price_per_km: Joi.string(),
      user_type: Joi.string(),
      message_type: Joi.string(),
      schedule: Joi.string(),
    })
    .unknown()
    .min(1),
};

module.exports = {
  // GET /v1/route
  listNotification,
  getNotification,
  // POST /v1/route
  createNotification,
  // PATCH /v1/route/:routeId
  updateNotification,
  deleteNotification,
};
