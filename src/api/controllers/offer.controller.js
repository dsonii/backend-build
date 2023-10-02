const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Route = require("../models/route.model");
const Offer = require("../models/offer.model");
const Booking = require("../models/booking.model");
const RouteDetail = require("../models/routeDetail.model");
const { imageDelete, imageUpload } = require("../services/uploaderService");
const base64Img = require("base64-img");
const faker = require("../helpers/faker");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const uuidv4 = require("uuid/v4");
const mongoose = require('mongoose');

/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    // console.log(route);
    res.status(httpStatus.OK);
    res.json({
      message: "Single offer successfully.",
      data: offer,
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
    const {
      adminId,
      routeId,
      name,
      type,
      start_date,
      end_date,
      code,
      discount,
      picture,
      attempt,
      status,
      terms,
    } = req.body;
    const FolderName = process.env.S3_BUCKET_OFFER;
    const saveOffer = {
      adminId,
      routeId: routeId || null,
      name,
      start_date,
      end_date,
      code,
      discount,
      type,
      status,
      attempt,
      terms,
    };
    if (picture) {
      saveOffer.picture = await imageUpload(
        picture,
        `offer-${uuidv4()}`,
        FolderName
      );
    }

    const offer = await new Offer(saveOffer).save();
    return res.json({
      status: true,
      message: "offer create successfully",
      data: offer,
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
    const FolderName = process.env.S3_BUCKET_OFFER;
    const offerexists = await Offer.findById(req.params.offerId).exec();
    if (offerexists) {
      const objUpdate = {
        adminId: req.body.adminId,
        name: req.body.name,
        code: req.body.code,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        discount: req.body.discount,
        type: req.body.type,
        status: req.body.status,
        attempt: req.body.attempt,
        routeId: req.body.routeId != "" ? req.body.routeId : null,
      };

      if (Offer.isValidBase64(req.body.picture)) {
        await imageDelete(offerexists.picture, FolderName);
        objUpdate.picture = await imageUpload(
          req.body.picture,
          `offer-${uuidv4()}`,
          FolderName
        );
      }

      const updateOffer = await Offer.findByIdAndUpdate(
        req.params.offerId,
        {
          $set: objUpdate,
        },
        {
          new: true,
        }
      );
      if (updateOffer) {
        res.status(httpStatus.CREATED);
        return res.json({
          status: true,
          message: "offer updated successfully",
          data: updateOffer,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        status: true,
        message: "No offer found.",
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
              name: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              code: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              route_name: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            { status: req.query.global_search != "inactive" },
          ],
          is_deleted: false,
        }
      : { is_deleted: false };

    let sort = {};
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = {
        [data.name]: data.order != "none" ? data.order : "asc",
      };
    }

    //    console.log('1212', sort);
    const options = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "offers",
      },
      sort,
    };

    const aggregateQuery = await Offer.aggregate([
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: {
          path: "$route",
          preserveNullAndEmptyArrays: true, // Handle potential null values
        },
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          adminId: 1,
          name: 1,
          code: 1,
          discount: 1,
          attempt: 1,
          start_date: { 
		   $dateToString: {
			  timezone:DEFAULT_TIMEZONE,
			  format: "%d-%m-%Y", // specify your desired date format
			  date: "$start_date"     // replace with the actual date field you want to format
			}
		  }, // moment.utc(item.start_date).format('MMM DD, YYYY'),
          end_date:  {
			 $dateToString: {
			  timezone:DEFAULT_TIMEZONE,
			  format: "%d-%m-%Y", // specify your desired date format
			  date: "$end_date"     // replace with the actual date field you want to format
			}
		  }, // moment.utc(item.end_date).format('MMM DD, YYYY'),
          type: {
            $cond: {
              if: { $eq: ["$type", true] },
              then: "route not applied",
              else: "route applied",
            },
          },
          route_name: { $ifNull: ["$route.title", "-"] },
          terms: 1,
          picture: 1,
          status: {
            $cond: {
              if: { $eq: ["$status", true] },
              then: "Active",
              else: "InActive",
            },
          },
          createdAt: 1,
        },
      },
      {
        $match: condition,
      },
    ]);
	
	 const result = await Offer.paginate(condition, options);
      result.offers = Offer.transformData(result.offers);
   // const result = await Offer.aggregatePaginate(aggregateQuery, options);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    const FolderName = process.env.S3_BUCKET_BUS;
    if(await Offer.exists({ _id: req.params.offerId })) {
		if(await Booking.exists({offerId:mongoose.Types.ObjectId(req.params.offerId)})){
			res.status(httpStatus.OK).json({
				  status: true,
				  message: "Offer already used in booking. can't be deleted.",
				});
		}else{
			  const offerexists = await Offer.findOne({ _id: req.params.offerId });
			  if (Offer.isValidURL(offerexists.picture)) {
				await imageDelete(offerexists.picture, FolderName);
			  }
			  const deleteOffer = await Offer.updateOne(
				{ _id: req.params.offerId },
				{ is_deleted: true }
			  );
			  if (deleteOffer) {
				res.status(httpStatus.OK).json({
				  status: true,
				  message: "Offer deleted successfully.",
				});
			  }
		}
    }
  } catch (err) {
    next(err);
  }
};
