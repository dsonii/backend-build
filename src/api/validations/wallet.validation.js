const Joi = require("joi");
const { objectId } = require("./custom.validation");

// const listOffer = {
//   query: Joi.object().keys({
//     page: Joi.number().min(1),
//     perPage: Joi.number().min(1).max(100),
//     status: Joi.boolean(),
//   }),
// };

const createWallet = {
  body: Joi.object().keys({
    adminId: Joi.string().custom(objectId),
    amount: Joi.string(),
  }).unknown(),
};


// const updateOffer = {
//   params: Joi.object().keys({
//     offerId: Joi.required().custom(objectId),
//   }),
//   body: Joi.object()
//     .keys({
//       name: Joi.string(),
//       code: Joi.string(),
//       status: Joi.boolean(),
//     })
//     .min(1),
// };



// const deleteOffer = {
//   params: Joi.object().keys({
//     offerId: Joi.string().custom(objectId),
//   }),
// };


module.exports = {
  // GET /v1/route
 // listOffer,
  // POST /v1/route
  createWallet,
  // PATCH /v1/route/:routeId
  //updateOffer,
 // deleteOffer
};
