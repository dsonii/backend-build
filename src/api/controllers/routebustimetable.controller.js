const Route = require("../models/route.model");
const RouteBusTimetable = require("../models/routeBusTimetable.model");




exports.load =async (req, res) => {
  try {
    const routeBusTimeTable = await RouteBusTimetable.find({status:true}).sort({_id:-1});
    res.status(httpStatus.OK);
    res.json({
      message: "route bus time table load successfully.",
      data: routeBusTimeTable,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get bus
 * @public
 */
 exports.get = async (req, res) => {
  try {
    const route = await Route.findById(req.params.routebustimetableId);
    res.json({
      message: "time table load successfully.",
      data: route,
      status: true,
    });

  } catch (error) {
    console.log(error);
    return error;
  }
};




/**
 * Update existing routes
 * @public
 */

 exports.update = async (req, res, next) => {
  try {
  } catch (error) {
    console.log(error);
    return error;
  }
};
