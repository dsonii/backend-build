const httpStatus = require("http-status");
const Route = require("../models/route.model");
const RouteBus = require("../models/routeBus.model");





/**
 * Get bus
 * @public
 */
 exports.get = async (req, res) => {
  try {

    const routebus = await RouteBus.findById(req.params.routebusId);

    res.status(httpStatus.OK);
    res.json({
      message: "Single route successfully.",
      data:routebus,
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
    const {busId,every,start_date,end_date,routeId,stops,status,departure_time,arrival_time} = req.body;
    const update = {
        busId,
        every,
        start_date,
        end_date,
        routeId,
        departure_time,
        arrival_time,
        status,
    }

    const updateroutebus = await RouteBus.updateOne({_id:req.params.id},update)

    res.status(httpStatus.OK);
    res.json({
      message: "Single route successfully.",
      data:updateroutebus,
      status: true,
    })

  } catch (error) {
    console.log(error);
    return error;
  }
};
