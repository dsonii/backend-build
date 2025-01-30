const httpStatus = require("http-status");
const Admin = require("../models/admin.model");
const Role = require("../models/role.model");
const AdminDetail = require("../models/adminDetail.model");
const AdminRole = require("../models/adminRole.model");
const Setting = require("../models/setting.model");
const RefreshToken = require("../models/refreshToken.model");
const PasswordResetToken = require("../models/passwordResetToken.model");
const slug = require("slug");
const moment = require("moment-timezone");
const {
  jwtExpirationInterval,
  BASEURL,
  port,
  FULLBASEURL,
} = require("../../config/vars");
const Listeners = require("../events/Listener");
const { omit } = require("lodash");
const APIError = require("../utils/APIError");
const emailProvider = require("../services/emails/emailProvider");
const {
  imageDelete,
  imageUpload,
  resizeUpload,
  uploadLocal,
  deleteLocal,
} = require("../services/uploaderService");
const uuidv4 = require("uuid/v4");
const mongoose = require("mongoose");
const { isValidURL } = require("../helpers/validate");
/**
 * Returns a formated object with tokens
 * @private
 */
function generateTokenResponse(admin, accessToken) {
  const tokenType = "Bearer";
  const refreshToken = RefreshToken.generate(admin).token;
  const expiresIn = moment()
    .local()
    .add(24, "hours")
    .unix();
  console.log(
    "expiresIn",
    expiresIn,
    "current unix",
    moment(moment.unix(expiresIn)).local().format("LLL")
  );
  return {
    tokenType,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (req, res, next) => {
  try {
    const adminData = omit(req.body, "role");
    const admin = await new Admin(adminData).save();
    const adminDetail = {
      adminId: admin._id,
      company: req.body.company,
      address_1: req.body.address_1,
      address_2: req.body.address_2,
      city: req.body.city,
      pincode: req.body.pincode,
      is_agent: req.body.is_agent,
      commission: req.body.commission,
    };
    await new AdminDetail(adminDetail).save();
    const adminTransformed = admin.transform();
    adminTransformed.picture = `${FULLBASEURL}${adminTransformed.picture}`;
    const token = generateTokenResponse(admin, admin.token());
    res.status(httpStatus.CREATED);
    return res.json({ token, admin: adminTransformed });
  } catch (error) {
    return next(Admin.checkDuplicateEmail(error));
  }
};

/**
 * Returns jwt token if valid adminname and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    const { admin, accessToken } = await Admin.findAndGenerateToken(req.body);
    const token = generateTokenResponse(admin, accessToken);
    const adminTransformed = admin.transform();

    let picture = adminTransformed.picture
      ? adminTransformed.picture
      : "public/profile/default.jpg";
    adminTransformed.picture = (await Admin.isValidURL(
      adminTransformed.picture
    ))
      ? adminTransformed.picture
      : `${FULLBASEURL}${picture}`;

    return res.json({ token });
  } catch (error) {
    return next(error);
  }
};

exports.access = async (req, res, next) => {
  try {
    const { roleId } = req.body;
    const getPermissions = await Role.getPermission(roleId);
    const general = await Setting.getgeneral();
    return res.json({ permissions: getPermissions.permissions, general });
  } catch (error) {
    return next(error);
  }
};
/**
 * login with an existing admin or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (req, res, next) => {
  try {
    const { admin } = req;
    const accessToken = admin.token();
    const token = generateTokenResponse(admin, accessToken);
    const adminTransformed = admin.transform();
    return res.json({ token, admin: adminTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    const { email, refreshToken } = req.body;
    const refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    });
    const { admin, accessToken } = await Admin.findAndGenerateToken({
      email,
      refreshObject,
    });

    const response = generateTokenResponse(admin, accessToken);
    const adminTransformed = admin.transform();

    adminTransformed.picture = (await Admin.isValidURL(
      adminTransformed.picture
    ))
      ? adminTransformed.picture
      : `${FULLBASEURL}${adminTransformed.picture}`;
    return res.json({
      status: true,
      user: adminTransformed,
      token: response,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  const ommitRole = req.locals.admin.role !== "admin" ? "role" : "";
  const updatedAdmin = omit(req.body, ommitRole);
  const admin = Object.assign(req.locals.admin, updatedAdmin);

  admin
    .save()
    .then(savedAdmin => res.json(savedAdmin.transform()))
    .catch(e => next(Admin.checkDuplicateEmail(e)));
};

exports.sendPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email }).exec();

    if (admin) {
      const passwordResetObj = await PasswordResetToken.generate(admin);
      emailProvider.sendPasswordReset(passwordResetObj);
      res.status(httpStatus.OK);
      return res.json({
        message: `we have sucessfully send reset link in your email ${email}.`,
        status: true,
      });
    }
    throw new APIError({
      status: httpStatus.UNAUTHORIZED,
      message: "No account found with that email address",
    });
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, password, resetToken } = req.body;
    const resetTokenObject = await PasswordResetToken.findOneAndRemove({
      userEmail: email,
      resetToken,
    });

    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (!resetTokenObject) {
      throw new APIError({
        status: httpStatus.UNAUTHORIZED,
        message: "Cannot find matching reset token",
      });
    }
    if (moment().isAfter(resetTokenObject.expires)) {
      throw new APIError({
        status: httpStatus.UNAUTHORIZED,
        message: "Reset token is expired",
      });
    }

    const admin = await Admin.findOne({
      email: resetTokenObject.userEmail,
    }).exec();
    admin.password = password;
    await admin.save();
    emailProvider.sendPasswordChangeEmail(admin);
    res.status(httpStatus.OK);
    return res.json({
      message:
        "Your password for Ferri has been changed successfully. You can now login with your new password",
      status: true,
    });
  } catch (error) {
    return next(error);
  }
};

exports.authLists = async (req, res, next) => {
  try {
    let condition = req.query.global_search
      ? {
          $and: [
            {
              $or: [
                {
                  fullname: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  lastname: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  email: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  phone: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  role: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                { status: req.query.global_search != "inactive" },
              ],
            },
            { role: { $ne: "agents" } },
          ],
        }
      : { role: { $ne: "agents" } };

    let sort = {};
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = { [data.name]: data.order != "none" ? data.order : "asc" };
    }

    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);
      if (filtersData.type == "simple") {
        condition = {
          [filtersData.name]: filtersData.text,
          role: { $ne: "agents" },
        };
      } else if (filtersData.type == "select") {
        condition = {
          [filtersData.name]: { $in: filtersData.selected_options },
          role: { $ne: "agents" },
        };
      }
    }

    const aggregateQuery = Admin.aggregate([
      {
        $lookup: {
          from: "admin_details",
          localField: "adminId",
          foreignField: "_id",
          as: "admin_detail",
        },
      },
      {
        $unwind: {
          path: "$admin_detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          id: {
            $toString: {
              $add: [{ $indexOfArray: [[], "$_id"] }, 1],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          id: 1,
          picture: {
            $cond: [
              {
                $regexMatch: {
                  input: "$picture",
                  regex: /^(http|https):\/\//,
                },
              },
              "$picture",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$picture",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.BASEURL}:${process.env.PORT}/public/admin/profiles/default.jpg`,
                  {
                    $concat: [
                      `${process.env.BASEURL}:${process.env.PORT}/public/admin/profiles/`,
                      "$picture",
                    ],
                  },
                ],
              },
            ],
          },
          fullname: { $concat: ["$firstname", " ", "$lastname"] },
          short_name: {
            $toUpper: {
              $concat: [
                { $substr: ["$firstname", 0, 1] },
                { $substr: ["$lastname", 0, 1] },
              ],
            },
          },
          email: 1,
          phone: 1,
          role: 1,
          address_1: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.address_1",
                  else: "$admin_detail.address_1",
                },
              },
              "",
            ],
          },
          address_2: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.address_2",
                  else: "$admin_detail.address_2",
                },
              },
              "",
            ],
          },
          city: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.city",
                  else: "$admin_detail.city",
                },
              },
              "",
            ],
          },
          contact_no: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.contact_no",
                  else: "$admin_detail.contact_no",
                },
              },
              "",
            ],
          },
          pincode: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.pincode",
                  else: "$admin_detail.pincode",
                },
              },
              "",
            ],
          },
          company: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.company",
                  else: "$admin_detail.company",
                },
              },
              "",
            ],
          },
          is_agent: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.is_agent",
                  else: "$admin_detail.is_agent",
                },
              },
              "",
            ],
          },
          commission: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.commission",
                  else: "$admin_detail.commission",
                },
              },
              "",
            ],
          },
          document_gst_certificate: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_gst_certificate",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_gst_certificate",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$document_gst_certificate",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.BASEURL}:${process.env.PORT}/public/admin/documents/default.jpg`,
                  {
                    $concat: [
                      `${process.env.BASEURL}:${process.env.PORT}/public/admin/documents/`,
                      "$document_gst_certificate",
                    ],
                  },
                ],
              },
            ],
          },
          document_pan_card: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_pan_card",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_pan_card",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$document_pan_card",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.BASE_URL}:${process.env.PORT}/public/admin/documents/default.jpg`,
                  {
                    $concat: [
                      `${process.env.BASE_URL}:${process.env.PORT}/public/admin/documents/`,
                      "$document_pan_card",
                    ],
                  },
                ],
              },
            ],
          },
          last_login: 1,
          is_active: {
            $cond: {
              if: { $eq: ["$is_active", true] },
              then: "Active",
              else: "Inactive",
            },
          },
          createdAt: 1,
        },
      },
      {
        $addFields: {
          sequence: { $add: [{ $indexOfArray: ["$_id", "$_id"] }, 1] },
        },
      },
      {
        $match: condition,
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "admins",
      },
      sort,
    };

    const result = await Admin.aggregatePaginate(aggregateQuery, options);

    // const paginationoptions = {
    //   page: req.query.page || 1,
    //   limit: req.query.per_page || 10,
    //   collation: { locale: 'en' },
    //   customLabels: {
    //     totalDocs: 'totalRecords',
    //     docs: 'users',
    //   },
    //   sort,
    //   populate: 'admin_details',
    //   lean: true,
    //   leanWithId: true,
    // };
    // console.log('paginationoptions', paginationoptions);
    // const result = await Admin.paginate(condition, paginationoptions);
    // result.users = Admin.transformData(result.users);
    res.json({ data: result });
  } catch (error) {
    console.log("error111", error);
    next(error);
  }
};

exports.agentLists = async (req, res, next) => {
  try {
    let condition = req.query.global_search
      ? {
          $and: [
            {
              $or: [
                {
                  firstname: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  lastname: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  email: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  phone: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                { status: req.query.global_search != "inactive" },
              ],
            },
            { role: "agents" },
          ],
        }
      : { role: "agents" };

    let sort = {};
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = { [data.name]: data.order != "none" ? data.order : "asc" };
    }

    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);
      if (filtersData.type == "simple") {
        condition = {
          [filtersData.name]: filtersData.text,
          role: "agents",
        };
      } else if (filtersData.type == "select") {
        condition = {
          [filtersData.name]: { $in: filtersData.selected_options },
          role: "agents",
        };
      }
    }

    //    console.log('1212', sort);
    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "agents",
      },
      sort,
      populate: "admin_details",
      lean: true,
      leanWithId: true,
    };

    const result = await Admin.paginate(condition, paginationoptions);
    result.agents = Admin.transformData(result.agents);
    res.json({ data: result });
  } catch (error) {
    console.log("error111", error);
    next(error);
  }
};

/**
 * Create new admin
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      email,
      role,
      phone,
      contact_no,
      is_active,
      address_1,
      address_2,
      company,
      city,
      pincode,
      picture,
      document_gst_certificate,
      document_pan_card,
    } = req.body;
    const FolderName =
      role == "agents"
        ? process.env.S3_BUCKET_AGENTDOC
        : process.env.S3_BUCKET_USERPRO;
    const objadmin = {
      firstname,
      lastname,
      email,
      phone,
      password: phone,
      is_active,
      role,
    };

    const isProductionS3 = await Setting.gets3();

    //  console.log("picture", picture);
    if (picture && (await Admin.isValidBase64(picture))) {
      if (isProductionS3.is_production) {
        // upload data to aws s3,
        const base64 = picture.replace(/^data:image\/\w+;base64,/, "");
        const buffer = await resizeUpload(true, base64, 40, 40);
        objadmin.picture = await imageUpload(
          buffer,
          `profile-${uuidv4()}`,
          FolderName
        );
      } else {
        objadmin.picture = await uploadLocal(picture, FolderName);
      }
    } else {
      objadmin.picture = "public/profile/default.png";
    }

    const getRoleId = await Role.findOne({ slug: slug(role) }).lean();
     objadmin.roleId = getRoleId._id; // find role ID to save admin collection
    const admin = new Admin(objadmin);
    const savedAdmin = await admin.save();
    const adminRole = new AdminRole({
      roleId: getRoleId._id,
      adminId: savedAdmin._id,
    });
    await adminRole.save();
    if (savedAdmin) {
      const objdetails = {
        contact_no: contact_no || "",
        address_1: address_1 || "",
        address_2: address_2 || "",
        city: city || "",
        pincode: pincode || "",
        is_agent: role == "agents",
        company: company || "",
        document_gst_certificate: document_gst_certificate
          ? await imageUpload(
              document_gst_certificate,
              `gst-certificate-${uuidv4()}`,
              FolderName
            )
          : "public/documents/default.jpg",
        document_pan_card: document_pan_card
          ? await imageUpload(
              document_pan_card,
              `pan-card-${uuidv4()}`,
              FolderName
            )
          : "public/documents/default.jpg",
      };
      objdetails.adminId = savedAdmin._id;
      Listeners.eventsListener.emit("Add-Admin-Detail", objdetails);
    }
    res.status(httpStatus.CREATED);
    // admin: savedAdmin.transform()
    res.json({
      message: `${role} created successfully.`,
      admin: savedAdmin.transform(),
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET new admin
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const admin = await Admin.get(req.params.adminId);
    // const admin_role = await AdminRole.getUser(admin._id);
    // if (!admin_role) return res.status(404).json({ status: false, message: 'No Record Found!' });

    res.status(httpStatus.OK);
    res.json({
      message: " data generated successfully.",
      fullname: `${admin.firstname} ${admin.lastname}`,
      user: {
        id: admin._id,
        firstname: admin.firstname,
        lastname: admin.lastname,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        picture: Admin.isValidURL(admin.picture)
          ? admin.picture
          : `${FULLBASEURL}public/profile/default.png`,
        address_1: admin.admin_details.address_1,
        address_2: admin.admin_details.address_2,
        city: admin.admin_details.city,
        contact_no: admin.admin_details.contact_no,
        pincode: admin.admin_details.pincode,
        company: admin.admin_details.company ? admin.admin_details.company : "",
        is_agent: admin.admin_details.is_agent,
        commission: admin.admin_details.commission,
        document_gst_certificate: Admin.isValidURL(
          admin.admin_details.document_gst_certificate
        )
          ? admin.admin_details.document_gst_certificate
          : `${FULLBASEURL}${admin.admin_details.document_gst_certificate}`,
        document_pan_card: Admin.isValidURL(
          admin.admin_details.document_pan_card
        )
          ? admin.admin_details.document_pan_card
          : `${FULLBASEURL}${admin.admin_details.document_pan_card}`,
        is_active: admin.is_active ? "true" : "false",
      },
      status: true,
    });
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};

/**
 * Update existing user status
 * @public
 */
exports.status = async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const update = await Admin.updateOne(
      { _id: req.params.adminId },
      { is_active: status == "Active" ? "true" : "false" }
    );
    if (update.n > 0) {
      res.json({
        message: `${role} status now is ${status}.`,
        status: true,
      });
    } else {
      res.json({
        message: "updated failed.",
        status: false,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      email,
      role,
      phone,
      contact_no,
      is_active,
      address_1,
      address_2,
      company,
      city,
      pincode,
      picture,
      document_gst_certificate,
      document_pan_card,
    } = req.body;

    const adminexists = await Admin.findById(req.params.adminId).exec();
    const isProductionS3 = await Setting.gets3();

    const FolderName = process.env.S3_BUCKET_USERPRO;

    if (adminexists) {
      const update = {
        firstname,
        lastname,
        email,
        phone,
        role: slug(role),
        is_active,
      };

      if (picture && (await Admin.isValidBase64(picture))) {
        if (isProductionS3.is_production) {
          // upload data to aws s3
          Admin.isValidURL(adminexists.picture)
            ? await imageDelete(adminexists.picture, FolderName)
            : "";

          const base64 = picture.replace(/^data:image\/\w+;base64,/, "");
          const buffer = await resizeUpload(true, base64, 40, 40);
          update.picture = await imageUpload(
            buffer,
            `profile-${uuidv4()}`,
            FolderName
          );
        } else {
          update.picture = await uploadLocal(picture, FolderName);
        }
      } else {
        update.picture = adminexists.picture;
      }
      const updateadmins = await Admin.findByIdAndUpdate(
        mongoose.Types.ObjectId(req.params.adminId),
        update,
        {
          new: true,
        }
      );
      const getRoleId = await Role.findOne({ slug: slug(role) }).lean();

      let getAdminRole = await AdminRole.findOne({
        adminId: mongoose.Types.ObjectId(req.params.adminId),
      });
      if (getAdminRole) {
        await AdminRole.findByIdAndUpdate(
          { _id: getAdminRole._id },
          {
            roleId: getRoleId._id,
            adminId: mongoose.Types.ObjectId(req.params.adminId),
          },
          { new: true }
        );
      } else {
        const adminRole = new AdminRole({
          roleId: getRoleId._id,
          adminId: mongoose.Types.ObjectId(req.params.adminId),
        });
        await adminRole.save();
      }
      if (updateadmins) {
        const existAdminDetail = await AdminDetail.findOne({
          adminId: mongoose.Types.ObjectId(req.params.adminId),
        }).exec();
        if (existAdminDetail) {
          const objdetails = {
            contact_no,
            address_1,
            address_2,
            city,
            pincode,
            is_agent: true,
            company,
          };
          if (document_gst_certificate) {
            Admin.isValidURL(existAdminDetail.document_gst_certificate)
              ? await imageDelete(
                  existAdminDetail.document_gst_certificate,
                  FolderName
                )
              : "";
            objdetails.document_gst_certificate = await imageUpload(
              document_gst_certificate,
              `gst-certificate-${uuidv4()}`,
              FolderName
            );
          } else {
            objdetails.document_gst_certificate =
              existAdminDetail.document_gst_certificate;
          }

          if (document_pan_card) {
            Admin.isValidURL(existAdminDetail.document_pan_card)
              ? await imageDelete(
                  existAdminDetail.document_pan_card,
                  FolderName
                )
              : "";
            objdetails.document_pan_card = await imageUpload(
              document_pan_card,
              `pan-card-${uuidv4()}`,
              FolderName
            );
          } else {
            objdetails.document_pan_card = existAdminDetail.document_pan_card;
          }

          Listeners.eventsListener.emit(
            "Update-Admin-Detail",
            updateadmins._id,
            objdetails
          );
        }
      }
      res.json({
        message: `${role} is update successfully.`,
        data: {
          id: updateadmins._id,
          firstname: updateadmins.firstname,
          lastname: updateadmins.lastname,
          email: updateadmins.email,
          phone: updateadmins.phone,
          role: updateadmins.role,
          picture: Admin.isValidURL(updateadmins.picture)
            ? updateadmins.picture
            : `${BASEURL}:${port}/${updateadmins.picture}`,
        },
        status: true,
      });
    } else {
      res.json({
        message: `${role} is not found.`,
        status: false,
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Delete Admin
 * @public
 */
exports.remove = (req, res, next) => {
  Admin.deleteOne({ _id: req.params.adminId })
    .then(() =>
      AdminDetail.deleteOne({ adminId: req.params.adminId }).then(() =>
        res.status(httpStatus.OK).json({
          status: true,
          message: " deleted successfully.",
        })
      )
    )
    .catch(e => next(e));
};
