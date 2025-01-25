const httpStatus = require('http-status');
const passport = require('passport');
const Admin = require('../models/admin.model');
const Role = require('../models/role.model');
const Resource = require('../models/resource.model');
const APIError = require('../utils/APIError');
const Listeners = require('../events/Listener');

const ADMIN = 'admin';
const STAFF = 'staff';
const LOGGED_USER = '_loggedUser';

const handleJWT = (req, res, next, roles) => async (err, user, info) => {
  const error = err || info;
  const logIn = Promise.promisify(req.logIn);
  const apiError = new APIError({
    message: error ? error.message : 'Unauthorized',
    status: httpStatus.UNAUTHORIZED,
    stack: error ? error.stack : undefined,
  });

  try {
    if (error || !user) throw error;
    await logIn(user, { session: false });
  } catch (e) {
    return next(apiError);
  }

  console.log('roles', roles, 'user.role', user.roles);
  // if (roles === LOGGED_USER) {
  //   if (user.role !== 'admin' && req.params.userId !== user._id.toString()) {
  //     apiError.status = httpStatus.FORBIDDEN;
  //     apiError.message = 'Forbidden';
  //     return next(apiError);
  //   }
  // } else
  const userRole = user.roles;
  const isFounded = roles.some(item => userRole.includes(item));
  console.log('isFounded', isFounded);
  // if (roles.length && !roles.includes(user.role)) {
  if (!isFounded) {
    apiError.status = httpStatus.FORBIDDEN;
    apiError.message = 'Forbidden';
    return next(apiError);
  } else if (err || !user) {
    return next(apiError);
  }

  req.user = user;

  return next();
};

exports.ADMIN = ADMIN;
exports.STAFF = STAFF;

exports.LOGGED_USER = LOGGED_USER;

exports.authorize =
  (roles = []) =>
    (req, res, next) =>
      passport.authenticate(
        'jwt',
        { session: false },
        handleJWT(req, res, next, roles),
      )(req, res, next);

exports.deletes3Object = (req, res, next) => {
  Listeners.eventsListener.emit('Delete-s3-Admin-Detail', req.params.adminId);
  next();
};

exports.oAuth = service => passport.authenticate(service, { session: false });

const authHandleJWT = (req, res, next, slug) => async (err, user, info) => {
  const error = err || info;
  const logIn = Promise.promisify(req.logIn);
  const apiError = new APIError({
    message: error ? error.message : 'Unauthorized',
    status: httpStatus.UNAUTHORIZED,
    stack: error ? error.stack : undefined,
  });

  try {
    if (error || !user) throw error;
    await logIn(user, { session: false });
  } catch (e) {
    return next(apiError);
  }

  if (user) {
    // req.resource = await Resource.findOne(
    //   { name },
    //   "_id resources_roles"
    // ).lean();

    // const getPerms = await Resource.findOne({
    //   _id: req.resource._id,
    //   // "resources_roles.role_id": user.roleId,
    //   // resources_roles:{ $elemMatch: { role_name : "Admin" } }
    //   resources_roles: {
    //     $filter: {
    //       input: "$resources_roles",
    //       as: "resources_role",
    //       cond: { $and: [{ $eq: ["$resources_role.role_name", "Admin"] }] },
    //     },
    //   },
    // });
    const getPerms = await Resource.aggregate([
      {
        $match: {
          slug,
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          resources_roles: {
            $filter: {
              input: '$resources_roles',
              as: 'resources_roles',
              cond: { $eq: ['$$resources_roles.role_id', user.roleId] },

            },
          },
        },
      },
    ]);
    //  console.log("getPerms", getPerms);
    const perms = getPerms[0].resources_roles;
    let allow = false;

    // mapping of methods to permissions
    perms.forEach((perm) => {
      // console.log("req.method", req.method, "perms.update", perm.update);

      if (req.method === 'POST' && perm.create) allow = true;
      else if (req.method === 'GET' && perm.read) allow = true;
      else if (req.method === 'PATCH' && perm.update) allow = true;
      else if (req.method === 'DELETE' && perm.delete) allow = true;
    });
    // console.log("allow : ",allow)
    if (allow) {
      req.user = user;
      return next();
    }
    apiError.status = httpStatus.FORBIDDEN;
    apiError.message = 'Forbidden';
    return next(apiError);


    return next(apiError);
  }
  if (err || !user) {
    return next(apiError);
  }

  return next();
};

exports.getAuth = role_slug => (req, res, next) =>
  passport.authenticate(
    'jwt',
    { session: false },
    authHandleJWT(req, res, next, role_slug),
  )(req, res, next);

