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

const authHandleJWT =
  (req, res, next, ...permissions) =>
    async (err, user, info) => {
      const error = err || info;
      const logIn = Promise.promisify(req.logIn);
      const apiError = new APIError({
        message: error ? error.message : 'Unauthorized',
        status: httpStatus.UNAUTHORIZED,
        stack: error ? error.stack : undefined,
      });

      const allowedPerms = [...permissions];
      try {
        if (error || !user) throw error;
        await logIn(user, { session: false });
      } catch (e) {
        return next(apiError);
      }


      if (user) {
        console.log('allowedPerms', allowedPerms);
        const getPerms = await Role.getPermission(user.roleId);
        if (getPerms) {
          const checkPermissions = getPerms.permissions
            .map(role => allowedPerms.includes(role.slug))
            .find(role => role === true);
          console.log('checkPermissions', checkPermissions);
          if (!checkPermissions) {
            apiError.status = httpStatus.FORBIDDEN;
            apiError.message = 'Forbidden';
            return next(apiError);
          }
          req.user = user;
          return next();
        }
        apiError.status = httpStatus.FORBIDDEN;
        apiError.message = 'Forbidden';
        return next(apiError);
      }
      if (err || !user) {
        return next(apiError);
      }
      return next();
    };

exports.getAuth =
  (...permissions) =>
    (req, res, next) =>
      passport.authenticate(
        'jwt',
        { session: false },
        authHandleJWT(req, res, next, ...permissions),
      )(req, res, next);
