const Permission = require('../models/permission.model');
const Role = require('../models/role.model');
const APIError = require('../utils/APIError');

const role = async () => {
  const getRoles = await Role.find({});
  const role = getRoles.map((v, i) => v.name);
  console.log('role', role);
};

const permissionExists = async (value, helpers) => {
  console.log('value', value);
  Permission.findOne({ name: value }, (err, permission) => {
    if (err) {
      return helpers.message('permission already exits');
    }
    return value;
  });
};

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 6) {
    return helpers.message('password must be at least 6 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

module.exports = {
  permissionExists,
  objectId,
  password,
  role,
};
