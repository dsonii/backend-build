const httpStatus = require('http-status');
const schedule = require("../services/schedule");
const { imageDelete, imageUpload } = require("../services/uploaderService");
const uuidv4 = require("uuid/v4");
const ScheduledNotification = require("../models/scheduledNotification.model");
const firebaseUser = require('../services/firebaseUser');
const User = require("../models/user.model");
const moment = require("moment-timezone");

/**
 * get notifications list
 * @public
 */
exports.list = async (req, res, next) => {
    try {
        let condition = req.query.global_search ? {
            $or: [
                { to: { $regex: '(\s+' + req.query.global_search + '|^' + req.query.global_search + ')', $options: 'i' } },
                { user_type: { $regex: '(\s+' + req.query.global_search + '|^' + req.query.global_search + ')', $options: 'i' } },
                // { type: req.query.global_search },
            ],
        } : {};

        let sort = {};
        if (!req.query.sort) {
            sort = { _id: -1 };
        } else {
            const data = JSON.parse(req.query.sort);
            sort = {
                [data.name]: (data.order != 'none') ? data.order : 'asc'
            };
        }

        if (req.query.filters) {
            const filtersData = JSON.parse(req.query.filters);
            condition = {
                [filtersData.name]: filtersData.selected_options[0]
            }
        }

        const paginationoptions = {
            page: req.query.page || 1,
            limit: req.query.per_page || 10,
            collation: { locale: 'en' },
            customLabels: {
                totalDocs: 'totalRecords',
                docs: 'notifications',
            },
            sort,
            lean: true,
        };

        const result = await ScheduledNotification.paginate(condition, paginationoptions);
        result.notifications = ScheduledNotification.transformData(result.notifications)
        res.json({ data: result });

        // const list = schedule.getJobs();
        // const keys = Object.keys(list);
        // let schedules = await ScheduledNotification.find({});
        // schedules = schedules.filter((item) =>
        //     keys.includes(item._id.toString()));
        // res.json({
        //     data: { schedules },
        //     status: "success",
        //     message: "successfull",
        // });


    } catch (error) {
        next(error);
    }
};


/**
 * post notifications create
 * @public
 */
exports.create = async (req, res, next) => {
    try {
        const payload = {
            to: req.body.to,
            days: req.body.days,
            time: req.body.time,
            days: req.body.days,
            user_type: req.body.user_type,
            message_type: req.body.message_type,
            schedule: req.body.schedule,
            notification: {
                title: req.body.title,
                body: req.body.content
            },
            user : [req.body.user.id]
        };
		
		

        if (req.body.picture) {
            const uploadedUrl = await imageUpload(
                req.body.picture,
                uuidv4(),
                'notifications'
            );

            payload.notification.picture = uploadedUrl;
        } else {
            payload.notification.picture = '';
        }

        if (payload.to === "to_all" && payload.user_type === 'customer') {

            if (payload.schedule === "immediately") {
                const time = moment().tz(DEFAULT_TIMEZONE).add(1, 'minutes').format("Y-MM-DD HH:mm");
                const days = [moment().tz(DEFAULT_TIMEZONE).day()];

                payload.time = time;
                payload.days = days;
                await schedule.createSchedule(payload);
            } else {
                await schedule.createSchedule(payload);
            }
            res.status(httpStatus.OK);
            res.json({
                message: "notification created successfully.",
                status: true,
            });
        } else {

            if (payload.schedule === "immediately") {
                const userId = req.body.user.id;// userI

                  const scheduledNotification = new ScheduledNotification({
                          to: payload.to,
                          time: payload.time,
                          days: payload.days,
                          user_type: payload.user_type,
                          notification: payload.notification,
                          message_type: payload.message_type,
                          schedule: payload.schedule,
                          send_total : {
                                success_count : 1,
                                failed_count : 0
                            }
                        });

                        await scheduledNotification.save();

                    if(scheduledNotification){
                        const getUser = await User.findById(userId).select("device_token device_type");

                            if (getUser && getUser.device_token) {
                                const title = scheduledNotification.notification.title;
                                const body = scheduledNotification.notification.body;
                                // const payload ={
                                //     token:getUser.device_token,
                                //     title,
                                //     body,
                                //     picture:scheduledNotification.notification.picture
                                // }
                                const payload = {
                                    notification: {
                                        title: title,
                                        body: body,
                                    },
                                    data: {
                                        title: title,
                                    },
                                    token: getUser.device_token
                                };
                            
                                await firebaseUser.sendSingleMessage(payload);
                           }
              
                    }
            } else {
                // const time = moment().tz(DEFAULT_TIMEZONE).add(1, 'minutes').format("HH:mm");
               // const days = [moment().tz(DEFAULT_TIMEZONE).day()];
		  
               // payload.time = time;
               // payload.days = days;
                await schedule.createSchedule(payload);
            }

            res.status(httpStatus.OK);
            res.json({
                message: "notification created successfully.",
                status: true,
            });
        }
    } catch (error) {
		console.log(error);
        next(error);
    }
};


/**
 * update  notifications status
 * @public
 */
exports.updateStatus = async (req, res, next) => {
    try {
		const notificationId = req.params.id;
		
		const result = await ScheduledNotification.updateStatus(notificationId,req.body.status);
		if(result.matchedCount > 0){
			res.status(httpStatus.OK);
            res.json({
                message: `notification is ${req.body.status}.`,
                status: true,
            });
		}else{
			res.status(httpStatus.OK);
            res.json({
                message: "notification status failed.",
                status: false,
            });
		}
		
    } catch (error) {
        next(error);
    }
};
	
/**
 * delete notifications create
 * @public
 */
exports.remove = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const list = schedule.getJobs();
        const currentJob = list[jobId];

        if (!currentJob) {
            if(ScheduledNotification.exists({_id:jobId})){
              const getSN = await ScheduledNotification.findById(jobId);
              if(getSN && getSN.notification.picture != ''){

                await imageDelete(getSN.notification.picture,"notifications");
              }
            }
            await ScheduledNotification.findByIdAndRemove(jobId);
        }else{

            if(ScheduledNotification.exists({_id:jobId})){
              const getSN = await ScheduledNotification.findById(jobId);
              if(getSN){

                await imageDelete(getSN.notification.picture,"notifications");
              }
            }
            await ScheduledNotification.findByIdAndRemove(jobId);
        }
       
       

        currentJob.cancel();
        res.json({
            status: true,
            message: "Delete successfull",
        });
    } catch (error) {
        next(error);
    }
}
