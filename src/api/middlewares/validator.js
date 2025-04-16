const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/APIError');

const validate = schema => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map(details => details.message).join(',');
    // console.log("errorMessage",errorMessage);
    return next(new ApiError({
      message: errorMessage,
      status: httpStatus.BAD_REQUEST,
      stack: error ? error.stack : undefined,
    }));
  }
  Object.assign(req, value);
  return next();
};

module.exports = validate;
