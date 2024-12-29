const httpStatus = require("http-status");
const { omit } = require("lodash");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const Booking = require("../models/booking.model");
const Payment = require("../models/payment.model");
const Passenger = require("../models/passenger.model");
const mongoose = require("mongoose");
/**
 * Load user and append to req.
 * @public
 */
// exports.load = async (req, res, next, id) => {
//   try {
//     const user = await User.get(id);
//     req.locals = { user };
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// };

/**
 * Get user
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const getuser = await User.findById(req.params.userId)
      .populate({
        path: "wallets",
        select: "amount",
      })
      .lean();
    UserData = User.formatedSingleData(getuser);
    res.json({ status: true, data: UserData });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.user.transform());

/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    const wallet = new Wallet({
      refercode: req.body.refercode,
      users: savedUser._id,
    });
    await wallet.save();
    res.status(httpStatus.CREATED);
    res.json({
      message: "User created successfully.",
      user: savedUser,
      status: true,
    });
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const newUser = new User(req.body);
    const ommitRole = user.role !== "admin" ? "role" : "";
    const newUserObject = omit(newUser.toObject(), "_id", ommitRole);
    console.log(newUserObject);
    await user.updateOne(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    res.json(savedUser.transform());
    
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

// const ommitRole = req.locals.user.role !== "admin" ? "role" : "";
// const updatedUser = omit(req.body, ommitRole);
// const user = Object.assign(req.locals.user, updatedUser);

// user
//   .save()
//   .then((savedUser) => {
//     const userTransformed = savedUser.transform();
//     userTransformed.picture = `${process.env.BASE_URL}${userTransformed.picture}`;
//     res.json(userTransformed);
//   })
//   .catch(e => next(User.checkDuplicateEmail(e)));
/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    //console.log("sdsad", req.query.filters);

    let condition = req.query.global_search
      ? {
          $or: [
            {
              wallet_balance: {
                $regex:
                  "(s+" +
                  req.query.global_search +
                  "|^" +
                  req.query.global_search +
                  ")",
                $options: "i",
              },
            },
            {
              fullname: {
                $regex:
                  "(s+" +
                  req.query.global_search +
                  "|^" +
                  req.query.global_search +
                  ")",
                $options: "i",
              },
            },
            {
              email: {
                $regex:
                  "(s+" +
                  req.query.global_search +
                  "|^" +
                  req.query.global_search +
                  ")",
                $options: "i",
              },
            },
            {
              phone: {
                $regex:
                  "(s+" +
                  req.query.global_search +
                  "|^" +
                  req.query.global_search +
                  ")",
                $options: "i",
              },
            },
            {
              gender: {
                $regex:
                  "(s+" +
                  req.query.global_search +
                  "|^" +
                  req.query.global_search +
                  ")",
                $options: "i",
              },
            },
            {
              refercode: {
                $regex:
                  "(s+" +
                  req.query.global_search +
                  "|^" +
                  req.query.global_search +
                  ")",
                $options: "i",
              },
            },
          ],
          is_deleted: false,
        }
      : {
        is_deleted: false,
          phone:{ $ne:""}
        };

    let sort = {};
    if (!req.query.sort) {
      sort = { createdAt: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = {
        [data.name]: data.order != "none" ? data.order : "asc",
      };
    }

    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);
      if (filtersData.type == "simple") {
        const name = [filtersData.name];
        if (name == "fullname") {
          const fullname = filtersData.text.split(" ");
          condition = {
            firstname: {
              $regex: "(s+" + fullname[0] + "|^" + fullname[0] + ")",
              $options: "i",
            },
            lastname: {
              $regex: "(s+" + fullname[1] + "|^" + fullname[1] + ")",
              $options: "i",
            },
            is_deleted: false,
          };
        } else {
          condition = {
            [filtersData.name]: filtersData.text,
            is_deleted: false,
          };
        }
      } else if (filtersData.type == "select") {
        condition = {
          [filtersData.name]: { $in: filtersData.selected_options },
          is_deleted: false,
        };
      } else if (filtersData.type == "date") {
        condition = {
          createdAt: {
            $gte: new Date(filtersData.value.startDate),
            $lte: new Date(filtersData.value.endDate),
          },
        };
      }
    }



    const aggregateQuery = User.aggregate([
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "users",
          as: "wallet",
        },
      },
      {
        $unwind: "$wallet",
      },
      {
        $project: {
          _id:0,
          ids: "$_id",
          is_deleted:1,
          firstname:1,
          lastname:1,
          fullname: { $concat: ["$firstname"," ", "$lastname"] },
          gender: 1,
          email: 1,
          phone: 1,
          country_code:1,
          customer_code:1,
          company:1,
		  language:1,
          createdAt:1,
          refercode: 1,
          status: {
            $cond: {
              if: { $eq: ["$status", true] },
              then: "Active",
              else: "InActive",
            },
          },
          ProfilePic: {
            $cond: [
              {
                $regexMatch: {
                  input: "$ProfilePic",
                  regex: /^(http|https):\/\//,
                },
              },
              "$ProfilePic",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$ProfilePic",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.FULL_BASEURL}public/users/profiles/default.jpg`,
                  {
                    $concat: [
                      `${process.env.FULL_BASEURL}public/users/profiles/`,
                      "$ProfilePic",
                    ],
                  },
                ],
              },
            ],
          }, 
          wallet_balance: { $ifNull: [{$concat:[DEFAULT_CURRENCY," ",{ $toString:"$wallet.amount"}]}, 0] },
         walletId: { $ifNull: ["$wallet._id", null] },
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
        docs: "users",
      },
      sort,
    };
    
    const result = await User.aggregatePaginate(aggregateQuery, options);

    res.json({ data: result });
  } catch (error) {
    console.log("err ", error);
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { search } = req.query;
    const condition = search
      ? {
          $or: [
            {
              firstname: { $regex: `(\s+${search}|^${search})`, $options: "i" },
            },
            { lastname: { $regex: new RegExp(search), $options: "i" } },
            { phone: { $regex: new RegExp(search), $options: "i" } },
            { email: { $regex: new RegExp(search), $options: "i" } },
          ],
          is_deleted: false,
        }
      : { is_deleted: false };
    const result = await User.find(condition).lean();
    res.json({
      total_count: result.length,
      items: await User.formatUser(result),
    });
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
    const { company, customer_code, firstname, lastname, email, country_code, phone, status } = req.body;
    const update = {
      company,
      customer_code,
      firstname,
      lastname,
      email,
      phone,
      country_code,
      status,
    };
    const updateusers = await User.findByIdAndUpdate(
      req.params.userId,
      update,
      {
        new: true,
      }
    );
    res.status(httpStatus.OK);
    res.json({
      status: true,
      message: "customer update successfully.",
      data: updateusers,
    });
  } catch (e) {
    next(User.checkDuplicateEmail(e));
  }
};

exports.walletHistories = async (req, res, next) => {
  try {
    const userId = req.query.userId;
    const walletId = req.query.walletId;
    const condition = req.query.global_search
      ? {
          $or: [
            {
              amount: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              method: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
          ],
          userId,
          walletId,
        }
      : { userId, walletId };

    let sort = {};
    let populatesort = { _id: -1 };
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = {
        [data.name]: data.order != "none" ? data.order : "asc",
      };
    }

    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "walletHistories",
      },
      sort,
      lean: true,
    };

    const result = await Payment.paginate(condition, paginationoptions);
    result.walletHistories = await Payment.formattedData(
      result.walletHistories
    );
    const user = await User.findById(userId).lean();
    result.customers = {
      fullname: user.firstname + " " + user.lastname,
      phone: user.phone,
      email: user.email,
    };
    res.json({ data: result });
  } catch (err) {
    console.log("err ", err);
    next(err);
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const checkUser = await User.exists({ _id: req.params.userId });
    if (checkUser) {
      if (await Booking.findOne({ userId: req.params.userId })) {
        const updateUser = await User.updateOne(
          {
            _id: req.params.userId,
          },
          { is_deleted: true }
        );
        if (updateUser) {
          const updateWallet = await Wallet.updateOne({
            users: req.params.userId,
            is_deleted: true,
          });

          if (updateWallet) {
            if (Booking.exists({ userId: req.params.userId })) {
              await Booking.updateOne(
                {
                  userId: req.params.userId,
                },
                { is_deleted: true }
              );
            }
            if (Passenger.exists({ userId: req.params.userId })) {
              await Passenger.updateOne(
                {
                  userId: req.params.userId,
                },
                { is_deleted: true }
              );
            }

            if (Payment.exists({ userId: req.params.userId })) {
              await Payment.updateOne(
                {
                  userId: req.params.userId,
                },
                { is_deleted: true }
              );
            }
            res.status(httpStatus.OK).json({
              status: true,
              message: " customer deleted successfully.",
            });
          } else {
            res.status(httpStatus.OK).json({
              status: false,
              message: " customer deleted but wallet not found.",
            });
          }
        } else {
          res.status(httpStatus.OK).json({
            status: false,
            message: "customer not deleted.",
          });
        }
      } else {
        await User.deleteOne({ _id: req.params.userId });
        await Wallet.deleteOne({ users: req.params.userId });
        res.status(httpStatus.OK).json({
          status: true,
          message: "customer  deleted permanently",
        });
      }
    } else {
      res.status(httpStatus.OK).json({
        status: false,
        message: " customer not found.",
      });
    }
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    next(err);
  } finally {
    // ending the session
    session.endSession();
  }
};
