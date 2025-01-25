const httpStatus = require('http-status');
const { omit, isEmpty } = require('lodash');
const Role = require('../models/role.model');
const Resource = require('../models/resource.model');
const { VARIANT_ALSO_NEGOTIATES } = require('http-status');
const mongoose = require('mongoose');

// /**
//  * Load user and append to req.
//  * @public
//  */
// exports.addRolePermission = async (req, res, next) => {
//   try {
//     const rolePermission = new RolePermission({
//       roleId: req.perms.roleId,
//       permissionId: req.body.permission,
//     });
//     const savedRolePermission = await rolePermission.save();
//     res.status(httpStatus.CREATED);
//     res.json({ message: 'Role Permission added successfully.', status: true });
//   } catch (error) {
//     return next(error);
//   }
// };

// exports.removeRolePermission = async (req, res, next) => {
//   try {
//     const rolePermissionExists = await RolePermission.exists({
//       roleId: req.perms.roleId,
//       permissionId: req.body.permission,
//     });
//     if (rolePermissionExists) {
//       await RolePermission.deleteOne({
//         roleId: req.perms.roleId,
//         permissionId: req.body.permission,
//       });
//       res.status(httpStatus.CREATED);
//       res.json({
//         message: 'Role Permission added successfully.',
//         status: true,
//       });
//     }
//   } catch (error) {
//     return next(error);
//   }
// };

exports.attach = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const { name, permissions } = req.body;
    const permissionLists = permissions.map((v, i) => v.code);
    const updaterole = await Role.findByIdAndUpdate(
      roleId,
      {
        $set: {
          name,
          permissions: permissionLists,
        },
      },
      {
        new: true,
      },
    );
    const transformedRole = updaterole.transform();

    res.json({
      message: 'attach role to Permission successfully.',
      data: transformedRole,
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next) => {
  try {
    const role = await Role.find({ slug: { $ne: 'agents' } }).sort({ name: 1 });
    res.status(httpStatus.OK);
    res.json({
      message: 'Role Type load data.',
      data: Role.transformOptions(role),
      status: true,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get role
 * @public
 */
exports.get = async (req, res) => {
  try {
    const role = await Role.findById(req.params.roleId);
    res.status(httpStatus.OK);
    res.json({
      message: 'Role fetched successfully.',
      data: await Role.transformSingleData(role),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get bsu layout list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const condition = req.query.global_search
      ? {
        $or: [
          {
            name: {
              $regex: new RegExp(req.query.global_search),
              $options: 'i',
            },
          },
        ],
      }
      : {};

    let sort = {};
    if (!req.query.sort) {
      sort = { name: 1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = { [data.name]: data.order != 'none' ? data.order : 'asc' };
    }

    //    console.log('1212', sort);
    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: 'en' },
      customLabels: {
        totalDocs: 'totalRecords',
        docs: 'roles',
      },
      sort,
      populate: [{ path: 'permissions', select: 'name' }],
      lean: true,
    };

    const result = await Role.paginate(condition, paginationoptions);
    result.roles = Role.transformData(result.roles);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new role
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const role = new Role(req.body);
    const savedRole = await role.save();
    res.status(httpStatus.CREATED);
    res.json({ message: 'Role created successfully.', status: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing bus type
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const updaterole = await Role.findByIdAndUpdate(
      req.params.roleId,
      {
        $set: {
          name: req.body.name,
          slug: req.body.slug,
        },
      },
      {
        new: true,
      },
    );
    const transformedRole = updaterole.transform();
    res.json({
      message: 'Role updated successfully.',
      data: transformedRole,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus type
 * @public
 */
exports.remove = (req, res, next) => {
  Role.deleteOne({
    _id: req.params.roleId,
  })
    .then(() =>
      res.status(httpStatus.OK).json({
        status: true,
        message: 'Role deleted successfully.',
      }))
    .catch(e => next(e));
};
