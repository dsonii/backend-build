const httpStatus = require('http-status');
const {
  omit, isEmpty,
} = require('lodash');
const TimeTable = require('../models/timetable.model');
const RouteStop = require('../models/routeStop.model');
const faker = require('../helpers/faker');
const { VARIANT_ALSO_NEGOTIATES } = require('http-status');
const Listeners = require("../events/Listener");
const moment = require("moment-timezone");

exports.testData = (req, res) => {
  const d = faker.seedDrivers('123456');
  res.status(httpStatus.OK);
  res.json({ d });
};
/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const timetable = await TimeTable.findById(req.params.timetableId)
    .populate({ path: "routeId"})
    .populate({path:"routestops",select:"stops"})
    .lean();
    res.status(httpStatus.OK);
    res.json({
      message: 'Time table found successfully.',
      data: await TimeTable.transFormSingleData(timetable),
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
    const {routeId,busId,direction,duration,time,every,start_date,end_date,stops,status} = req.body;
    const route = routeId.id;
    const timetableData ={
      busId,
      routeId:route,
      direction,
      time,
      every,
      duration,
      start_date: new Date(start_date),
      end_date:new Date(end_date),
      status
    }

    const timetable = await new TimeTable(timetableData).save();
    if(timetable){
      await RouteStop.updateRouteStop(stops,route);
      res.status(httpStatus.CREATED);
      return res.json({
        status: true,
        message: "Timetable create successfully",
      });
    }

  } catch (error) {
    return next(error);
  }
};


/**
 * Update existing bus
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const {busId,routeId,direction,duration,time,every,start_date,end_date,stops,status} = req.body;

    const updateTimeTable = await TimeTable.findByIdAndUpdate(req.params.timetableId,{
      $set: {
        routeId:routeId.id,
        busId,
        direction,
        time,
        every,
        duration,
        start_date: new Date(start_date),
        end_date:new Date(end_date),
        status
      },
    }, {
      new: true,
    });

    if (updateTimeTable) {
		 // event for update bus name
        await Listeners.eventsListener.emit("UPDATE-BUS-BOOKING", updateTimeTable.busId,updateTimeTable.routeId);  
        await RouteStop.updateRouteStop(stops,routeId.id);  
        res.status(httpStatus.CREATED);
        return res.json({
          status: true,
          message: "Timetable updated successfully",
          data: updateTimeTable,
        });
      }
  } catch (error) {
    next(error);
  }
};


exports.status = async (req, res, next) => {
  try {
    const { status} = req.body;
    const update = await TimeTable.updateOne({_id:req.params.timetableId},{status:status == 'Active' ? 'true' : 'false' })
    if(update.n > 0){
      res.json({
        message:`status now is ${status}.`,
        status: true,
      });
    }else{
      res.json({
        message:`updated failed.`,
        status: false,
      });
    }
   
  } catch (error) {

    next(error);
  }
};



/**
 * Get bus list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const condition = req.query.global_search
    ?
    {
      $or: [
        { direction: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
        { time: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
        {bus_name : { $regex: new RegExp(req.query.global_search), $options: 'i' }},
        {route_name : { $regex: new RegExp(req.query.global_search), $options: 'i' }},
        // {layout : { $regex: new RegExp(req.query.global_search), $options: 'i' } },
        { status: req.query.global_search != 'inactive'},
      ],
    }
    : {};

   // console.log("data",req.query.sort)
  let sort = {};
  if (!req.query.sort) {
    sort = { createdAt: -1 };
  } else {
    const data = JSON.parse(req.query.sort);

    sort = { [data.name]: (data.order != 'none') ? data.order : 'asc' };
  }

  //    console.log('1212', sort);
  const options = {
    page: req.query.page || 1,
    limit: req.query.per_page || 10,
    collation: { locale: 'en' },
    customLabels: {
      totalDocs: 'totalRecords',
      docs: 'timetables',
    },
    sort,
    // populate:[
    //   {path:"busId",select:"name"},
    //   {path:"routeId",select:"title"},
    // ],
    // lean: true,
  };

  const aggregateQuery = TimeTable.aggregate([
    {
      $lookup: {
        from: "routes",
        localField: "routeId",
        foreignField: "_id",
        as: "route",
      },
    },
    {
      $unwind: "$route",
    },
    {
      $lookup: {
        from: "buses",
        localField: "busId",
        foreignField: "_id",
        as: "bus",
      },
    },
    {
      $unwind: "$bus",
    },
    {
      $project:{
        _id:0,
        ids: "$_id",
        direction:1,
        time:1,
        // time: {
        //   $dateToString: {
        //     date: "$time",
        //     timezone: DEFAULT_TIMEZONE
        //   }
        // },
        bus_name: {$ifNull:["$bus.name",""]},
        busId:{$ifNull:["$bus._id",""]},
        route_name:{$ifNull:["$route.title",""]},
        routeId: {$ifNull:["$route._id",""]},
        status: {
          $cond:{
            if:{ $eq : ["$status",true]},
            then:"Active",
            else:"Inactive"
          }
        },
        createdAt:{
          $dateToString: {
            date: "$createdAt",
            timezone: DEFAULT_TIMEZONE
          }
        },
      }
    },
    // {
    //   $addFields: { 
    //     time: {
    //       $function: {
    //         body: function(time) {
    //           return moment(time).format("HH:MM A");
    //         },
    //         args: ["$time_format"],
    //         lang: "js"
    //       }
    //     },
    //     createdAt: {
    //       $function: {
    //         body: function(date) {
    //           return moment(date).format("DD MMM YYYY");
    //         },
    //         args: ["$createdAt_format"],
    //         lang: "js"
    //       }
    //     },
    //   }
    // }
  ]);
  const result = await TimeTable.aggregatePaginate(aggregateQuery, options);
  // const result = await TimeTable.paginate(condition, paginationoptions);
  // result.timetables = TimeTable.transformData(result.timetables)
  res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus
 * @public
 */
exports.remove = (req, res, next) => {
  TimeTable.deleteOne({
    _id: req.params.timetableId,
  })
    .then(() => 
    res.status(httpStatus.OK).json({
      status: true,
      message: 'Time Table deleted successfully.',
    }))
    .catch(e => next(e));
};
