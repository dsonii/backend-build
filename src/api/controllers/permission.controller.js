const APIError = require('../utils/APIError');
const httpStatus = require('http-status');
const Permission = require('../models/permission.model');
const Role = require('../models/role.model');
const slug = require('slug');

/**
 * load new permission
 * @public
 */
exports.load = async (req, res, next) => {
  try {
    const permission = await Permission.find({}).lean();
    res.status(httpStatus.OK);
    res.json({
      message: 'Permission load data.',
      data: await Permission.transformOptions(permission),
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Create new permission
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const permission = new Permission({
      name: req.body.name,
    });
    const savedPermission = await permission.save();
    res.status(httpStatus.CREATED);
    res.json({
      message: 'Permission created successfully.',
      permission: savedPermission.transform(),
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Update  permission
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const updatePermission = await Permission.findByIdAndUpdate(
      req.params.permissionId,
      {
        $set: {
          name: req.body.name,
          slug: slug(req.body.name, '.'),
        },
      },
      {
        new: true,
      },
    );
    const transformedPermission = updatePermission.transform();
    res.json({
      message: 'Permission updated successfully.',
      permission: transformedPermission,
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * get  permission
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const permission = await Permission.findById(req.params.permissionId);
    res.status(httpStatus.OK);
    res.json({
      message: 'Permission successfully.',
      data: permission.transform(),
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Delete  permission
 * @public
 */
exports.remove = (req, res, next) => {
  Permission.findOneAndDelete({
    _id: req.params.permissionId,
  })
    .then((err, permission) =>
      res.status(httpStatus.OK).json({
        status: true,
        message: 'Permission deleted successfully.',
      }))
    .catch(e => next(e));
};
