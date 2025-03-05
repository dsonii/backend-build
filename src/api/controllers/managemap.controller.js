const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Driver = require("../models/driver.model");
const APIError = require("../utils/APIError");

/**
 * Get the Active driver list
 * @public
 */
exports.driverData = async (req, res, next) => {
  try {
	  
     const { search,duty_status } = req.query;
    let condition ={};

    if (duty_status == 'TRACK') {
      if(search != ''){
        condition = {
          $match: {
            $and: [
              {
                type: "driver",
              },
              { status: true },
            ],
            $or: [
              {
                firstname: {
                  $regex: new RegExp(search),
                  $options: "i",
                },
              },
              {
                lastname: {
                  $regex: new RegExp(search),
                  $options: "i",
                },
              },
              {
                phone: {
                  $regex: new RegExp(search),
                  $options: "i",
                },
              },
            ]
          },
        };
      }else{
        condition = {
          $match: {
            $and: [
              {
                type: "driver",
              },
              { status: true },
            ],
          },
        };
  
      }
    } else {
      if(search != ''){
        condition = {
          $match: {
            $and: [
              {
                type: "driver",
              },
              { status: true },
              { duty_status: duty_status },
            ],
            $or: [
              {
                firstname: {
                  $regex: new RegExp(search),
                  $options: "i",
                },
              },
              {
                lastname: {
                  $regex: new RegExp(search),
                  $options: "i",
                },
              },
              {
                phone: {
                  $regex: new RegExp(search),
                  $options: "i",
                },
              },
            ]
          },
        };
      }else{
        condition = {
          $match: {
            $and: [
              {
                type: "driver",
              },
              { status: true },
              { duty_status: req.query.duty_status },
            ],
          },
        };
  
      }
    }
    

  
    const driver = await Driver.aggregate([
      condition,
      {
        $project: {
          _id: 0,
          id: "$_id",
          fullname: { $ifNull : [ { $concat: ["$firstname", " ", "$lastname"] },""] },
          email: 1,
          phone: 1,
          country_code: 1,
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
                  `${process.env.FULL_BASEURL}public/drivers/profiles/default.jpg`,
                  {
                    $concat: [
                      `${process.env.FULL_BASEURL}public/drivers/profiles/`,
                      "$picture",
                    ],
                  },
                ],
              },
            ],
          },
          status: {
            $cond: {
              if: ["$status", true],
              then: "Active",
              else: "Inactive",
            },
          },
          duty_status: 1,
          updatedAt: 1,
          position: {
            lat: {
              $ifNull: [
                { $arrayElemAt: ["$currentLocation.coordinates", 1] },
                0,
              ],
            },
            lng: {
              $ifNull: [
                { $arrayElemAt: ["$currentLocation.coordinates", 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    res.status(httpStatus.OK);
    res.json({
      message: "Driver get successfully.",
      data: driver,
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};
