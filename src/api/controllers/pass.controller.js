const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Pass = require("../models/pass.model");
const s3 = require("../../config/s3");
const base64Img = require("base64-img");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");


/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.passId);
    console.log(pass);
    res.status(httpStatus.OK);
    res.json({
      message: "Single pass successfully.",
      data: pass,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create new bus
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    let { no_of_rides, no_of_valid_days,terms,description, price_per_km, discount } = req.body;
    const pass = await new Pass({
      no_of_rides,
      no_of_valid_days,
      price_per_km,
      discount,
      terms,
      description
    }).save();
    return res.json({
      status: true,
      message: "offer pass successfully",
      data: pass,
    });
  } catch (error) {
    return res.json({
      status: false,
      message: "could not create",
      data: error.message,
    });
  }
};

/**
 * Update existing routes
 * @public
 */

exports.update = async (req, res, next) => {
  try {
    let { no_of_rides, no_of_valid_days, price_per_km, terms,description, discount } = req.body;
    const passexists = await Pass.findById(req.params.passId).exec();
    if (passexists) {
      const objUpdate = {
        no_of_rides,
        no_of_valid_days,
        price_per_km,
        discount,
        terms,
        description,
      };

      const updatePass = await Pass.findByIdAndUpdate(
        req.params.passId,
        {
          $set: objUpdate,
        },
        {
          new: true,
        }
      );
      if (updatePass) {
        res.status(httpStatus.CREATED);
        return res.json({
          status: true,
          message: "Pass updated successfully",
          data: updatePass,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        status: true,
        message: "No pass found.",
      });
    }
  } catch (error) {
    console.log("error", error);
    return next(error);
  }
};

/**
 * Get bus list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const condition = req.query.global_search
      ? {
          $or: [
            {
              no_of_valid_days: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              price_per_km: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              discount: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            { status: req.query.global_search != "inactive" },
          ],
        }
      : {};

    let sort = {};
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
        docs: "passes",
      },
      sort,
    };


    const result = await Pass.paginate(condition, paginationoptions);
    result.passes = Pass.transformData(result.passes);

    res.json({ data: result });
  } catch (error) {
    console.log('343 ',error)
    next(error);
  }
};

/**
 * Delete bus
 * @public
 */
exports.remove = (req, res, next) => {
  Pass.deleteOne({
    _id: req.params.passId,
  })
    .then(() => {
      res.status(httpStatus.OK).json({
        status: true,
        message: "Pass deleted successfully.",
      });
    })
    .catch(e => next(e));
};
