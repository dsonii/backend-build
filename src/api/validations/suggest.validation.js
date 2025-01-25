const Joi = require("joi");

const listSuggests = {
  query: Joi.object().keys({
    global_search:Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    per_page: Joi.number().min(1).max(100),
    name: Joi.string(),
  }).unknown()
};

module.exports = {
  // GET /v1/suggests
  listSuggests,
};
