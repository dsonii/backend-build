const location = require("../models/location.model");
const Route = require("../models/route.model");
const routeStop = require("../models/routeStop.model");
const BusSchedule = require("../models/busSchedule.model");
const busScheduleLocation = require("../models/busScheduleLocation.model");

const mongoose = require("mongoose");
const moment = require("moment-timezone");

const nearestData = async (
  pickupLongitude,
  pickupLatitude,
  pickupId,
  dropoffLongitude,
  dropoffLatitude,
  dropoffId,
  current_time
) => {
  let newDate = new Date();
  const MAX_DISTANCE = 5000;
  const PREBOOKING_MINUTE = 30;
  const current_date = moment
            .utc(newDate.toLocaleDateString())
            .tz(DEFAULT_TIMEZONE)
            .format("Y-MM-DD");
  const currentDateTime = `${current_time}T${current_time}:00.000Z`;
  const timezone = DEFAULT_TIMEZONE;
  const currentTime = new Date(`${current_date} ${current_time}`);
  const currentHourLocal = currentTime.getHours();
  const currentMinuteLocal = currentTime.getMinutes();
  const symtemDate = moment.tz(DEFAULT_TIMEZONE).date();

  const dayList = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  let day = dayList[currentTime.getDay()];
  // Convert local time to UTC
  const currentLocalUTC = new Date(
    currentTime.toLocaleString("en-US", { timeZone: DEFAULT_TIMEZONE })
  );
  
	let pickupStopIds = [];
	let dropStopIds = [];
	if (pickupId != "") {
    const getpickupData = await location.findOne({
      "location.coordinates": [pickupLongitude, pickupLatitude],
      type: "DA",
    }).lean();
    if (getpickupData) {
      pickupStopIds.push(getpickupData._id); // single
    } else {
      const getpickupStop = await location.findById(pickupId).lean();
      pickupStopIds.push(getpickupStop._id); // single
    }
  } else {
    const pickupStops = await location.nearestStops(
      pickupLatitude,
      pickupLongitude,
      MAX_DISTANCE
    );

    pickupStopIds = pickupStops.map((stop) => stop._id);
  }

  if (dropoffId != "") {
    const getdropoffStop = await location.findById(dropoffId).lean();

    dropStopIds.push(getdropoffStop._id); // single
  } else {
    const dropStops = await location.nearestStops(
      dropoffLatitude,
      dropoffLongitude,
      MAX_DISTANCE
    );
    dropStopIds = dropStops.map((stop) => stop._id);
  }


    const isOrderCorrect = await routeStop.stopOrderValidate(
    pickupStopIds,
    dropStopIds
  );
  if (isOrderCorrect[0].result) {
	  
	
  const nearestPickupDetails = await busScheduleLocation.aggregate([
      {
        $addFields: {
          arrival_hour: {
            $cond: {
              if: { $eq: ["$arrival_time", null] },
              then: {
                $hour: {
                  date: "$departure_time",
                  timezone,
                },
              },
              else: {
                $hour: {
                  date: "$arrival_time",
                  timezone,
                },
              },
            },
          },
          arrival_minute: {
            $cond: {
              if: { $eq: ["$arrival_time", null] },
              then: {
                $minute: {
                  date: "$departure_time",
                  timezone,
                },
              },
              else: {
                $minute: {
                  date: "$arrival_time",
                  timezone,
                },
              },
            },
          },
        },
      },
    {
      $addFields: {
        timeDifference: {
          $add: [
            {
              $multiply: [
                {
                  $subtract: ["$arrival_hour", currentHourLocal],
                },
                60,
              ],
            },
            {
              $subtract: ["$arrival_minute", currentMinuteLocal],
            },
          ],
        },
		systemDate: symtemDate,
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            //  { $eq: ["$stopId", pickupStopIds[0]] },
            { $in: ["$stopId", pickupStopIds] },
			   {
              $cond: [
                {
                  $eq: ["$systemDate", new Date(current_date).getDate()],
                },
                {
                  $gte: ["$timeDifference", PREBOOKING_MINUTE], // default pre booking default minutes 30
                },
                {
                 
                  $cond:[
                    { $lt:["$systemDate", new Date(current_date).getDate()]},
                    true,
                    true
                  ]
                },
              ],
            },
          ],
        },
      },
    },
    // {
    //   $lookup: {
    //     from: "bus_schedules",
    //     // localField:"busScheduleId",
    //     // foreignField:"_id",
    //     let: { busScheduleId: "$busScheduleId" },
    //     pipeline: [
    //       // {
    //       //   $match: { $expr: { $eq: ["$_id", "$$busScheduleId"] } },
    //       // },
    //       {
    //         $match: {
    //           $expr: {
    //             $and: [
    //               { $eq: ["$_id", "$$busScheduleId"] },
    //               { $lte: ["$start_date", new Date(current_date)] },
    //               { $gte: ["$end_date", new Date(current_date)] },
    //             ],
    //           },
    //         },
    //       },
    //       {
    //         $project: {
    //           departure_time: {
    //             $dateToString: {
    //               format: "%H:%M",
    //               date: "$departure_time",
    //               timezone,
    //             },
    //           },
    //           arrival_time: {
    //             $dateToString: {
    //               format: "%H:%M",
    //               date: "$arrival_time",
    //               timezone,
    //             },
    //           },
    //         },
    //       },
    //     ],
    //     as: "bus_schedule",
    //   },
    // },
    // {
    //   $unwind: "$bus_schedule",
    // },
    {
      $lookup: {
        from: "locations",
        localField: "stopId",
        foreignField: "_id",
        as: "stop",
      },
    },
    {
      $unwind: "$stop",
    },
    {
      $lookup: {
        from: "bus_schedules",
        localField: "busScheduleId",
        foreignField: "_id",
        as: "busSchedule",
      },
    },
    {
      $unwind: "$busSchedule",
    },
    {
      $match: {
        $expr: {
          $and: [
            { $eq: ["$busSchedule._id", "$busScheduleId"] },
            { $eq: ["$busSchedule.status", true] },
            { $in: [day,"$busSchedule.every"] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "routes",
        localField: "busSchedule.routeId",
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
        localField: "busSchedule.busId",
        foreignField: "_id",
        as: "bus",
      },
    },
    {
      $unwind: "$bus",
    },
    {
      $lookup: {
        from: "bus_schedule_locations",
        localField: "busScheduleId",
        foreignField: "busScheduleId",
        as: "bus_schedule_locations",
      },
    },
    {
      $addFields: {
        total_of_stops: { $size: "$bus_schedule_locations" },
      },
    },
    {
      $project: {
        _id: 0,
        total_of_stops: 1,
        busScheduleId: "$busScheduleId",
        value: { $ifNull: ["$route._id", "-"] },
        text: { $ifNull: ["$route.title", "-"] },
        route_busId: { $ifNull: ["$busSchedule.busId", "-"] },
        route_bus_timetable: { $ifNull: ["$busSchedule.every", []] },
        bus_details: {
          code: { $ifNull: ["$bus.code", "-"] },
          name: { $ifNull: ["$bus.name", "-"] },
          reg_no: { $ifNull: ["$bus.reg_no", "-"] },
          brand: { $ifNull: ["$bus.brand", "-"] },
          model_no: { $ifNull: ["$bus.model_no", "-"] },
          chassis_no: { $ifNull: ["$bus.chassis_no", "-"] },
          amenities: { $ifNull: ["$bus.amenities", []] },
          bus_layoutId: { $ifNull: ["$bus.buslayoutId", "-"] },
        },
        pickup_stop_id: "$stopId",
        pickup_stop_name: "$stop.title",
        pickup_stop_departure_time: {
          $dateToString: {
            format: "%H:%M",
            date: "$departure_time",
            timezone,
          },
        },
        pickup_stop_arrival_time: {
          $dateToString: {
            format: "%H:%M",
            date: "$arrival_time",
            timezone,
          },
        },
      },
    },
    {
       $sort: { pickup_stop_arrival_time: 1, pickup_stop_departure_time: 1 },
    },
  ]);
  const nearestDropoffDetails = await busScheduleLocation.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            //  { $eq: ["$stopId", dropStopIds[0]] },
            { $in: ["$stopId", dropStopIds] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "locations",
        localField: "stopId",
        foreignField: "_id",
        as: "stop",
      },
    },
    {
      $unwind: "$stop",
    },
    {
      $lookup: {
        from: "bus_schedules",
        localField: "busScheduleId",
        foreignField: "_id",
        as: "busSchedule",
      },
    },
    {
      $unwind: "$busSchedule",
    },
    {
      $match: {
        $expr: {
          $and: [
            { $eq: ["$busSchedule._id", "$busScheduleId"] },
            { $eq: ["$busSchedule.status", true] },
            { $in: [day,"$busSchedule.every"] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "routes",
        localField: "busSchedule.routeId",
        foreignField: "_id",
        as: "route",
      },
    },
    {
      $unwind: "$route",
    },
    {
      $project: {
        _id: 0,
        value: { $ifNull: ["$route._id", "-"] },
        text: { $ifNull: ["$route.title", "-"] },
        route_busId: { $ifNull: ["$busSchedule.busId", "-"] },
        busScheduleId: "$busScheduleId",
        drop_stop_name: "$stop.title",
        drop_stop_id: "$stopId",
        drop_stop_departure_time: {
          $dateToString: {
            format: "%H:%M",
            date: "$departure_time",
            timezone,
          },
        },
        drop_stop_arrival_time: {
          $dateToString: {
            format: "%H:%M",
            date: "$arrival_time",
            timezone,
          },
        },
      },
    },
    {
      $sort: { drop_stop_departure_time: 1,drop_stop_arrival_time:1 },
    },
  ]);

  // return {
  //   nearestPickupDetails,
  //   nearestDropoffDetails,
  // };
      let mergeroutes = [];
     nearestPickupDetails.map((pickupItem) => {
    const matchingDropItem = nearestDropoffDetails.find(
      (dropItem) =>
        dropItem.busScheduleId.toString() ===
        pickupItem.busScheduleId.toString()
    );
    if (matchingDropItem) {
       mergeroutes.push({ ...pickupItem, ...matchingDropItem });
    }
  });

	  return mergeroutes.filter(m => m !== null);
    }
  return [];
};

module.exports = {
  nearestData,
};
