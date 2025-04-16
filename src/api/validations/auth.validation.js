const Joi = require("joi");
const { password } = require("./custom.validation");

// POST /v1/auth/register
const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    phone: Joi.string(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const update = {
  body: {
    email: Joi.string().email(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    phone: Joi.string(),
  },
  params: {
    userId: Joi.string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .required(),
  },
};

// POST /v1/auth/facebook
// POST /v1/auth/google
const oAuth = {
  body: {
    access_token: Joi.string().required(),
  },
};

//   // POST /v1/auth/refresh
const refresh = {
  body: {
    email: Joi.string().email().required(),
    refreshToken: Joi.string().required(),
  },
};

//   // POST /v1/auth/refresh
const sendPasswordReset = {
  body: {
    email: Joi.string().email().required(),
  },
};

// POST /v1/auth/password-reset
const passwordReset = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required().custom(password),
    resetToken: Joi.string().required(),
  },
};

module.exports = {
  register,
  login,
  update,
  oAuth,
  refresh,
  sendPasswordReset,
  passwordReset
};

