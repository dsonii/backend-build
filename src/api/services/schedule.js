const _ = require('lodash');

const scheduleLib = require('node-schedule');
const firebaseUser = require('./firebaseUser');
const User = require('../models/user.model');
const Setting = require('../models/setting.model');
const ScheduledNotification = require('../models/scheduledNotification.model');

const schedule = {};
const moment = require('moment-timezone');


const { spawn } = require('child_process');
const path = require('path');


schedule.backupDB = function () {
  scheduleLib.scheduleJob('* */24 * * *', () => {
    const DB_NAME = 'busferri';
    const Time = moment().unix();

    const ARCHIVE_PATH = path.join(__dirname, '..', '..', '..', 'backup', `${DB_NAME}-${Time}.gzip`);
    console.log('ARCHIVE_PATH', ARCHIVE_PATH, 'Time', Time);

    const child = spawn('mongodump', [
      `--db=${DB_NAME}`,
      `--archive=${ARCHIVE_PATH}`,
	    '--gzip',
      // `--username=${DB_NAME}`,
      // '--password=BusFerri2021MSXBF',
    ]);

    child.stdout.on('data', (data) => {
      console.log('stdout:\n', data);
    });
    child.stderr.on('data', (data) => {
      console.log('stderr:\n', Buffer.from(data).toString());
    });
    child.on('error', (error) => {
      console.log('error:\n', error);
    });

    child.on('exit', (code, signal) => {
      if (code) console.log('Process exit with code:', code);
      else if (signal) console.log('Process killed with signal:', signal);
      else console.log('Backup is successfull ✅');
    });
  });
};


schedule.getJobs = function () {
  return scheduleLib.scheduledJobs;
};

schedule.createSchedule = async function (data) {
  try {
	
	  
    const scheduledNotification = new ScheduledNotification({
      to: data.to,
      time: data.time,
      days: data.days,
      user_type: data.user_type,
      notification: data.notification,
      message_type: data.message_type,
      schedule: data.schedule,
	  users:data.user 
      // notification: {
      //   title: data.title,
      //   body: data.body,
      // },
    });

    const getData = await scheduledNotification.save();

    const dayOfWeek = data.days.join(',');
	
	// Parse the input date-time in UTC
    const parsedDateTime = moment.utc(data.time);

    const timeToSent =  parsedDateTime.tz(DEFAULT_TIMEZONE).format("HH:mm").split(':');
    console.log("timeToSent",timeToSent)
	const hours = timeToSent[0];
    const minutes = timeToSent[1];

    const scheduleId = getData._id.toString();
  //  const scheduleTimeout = `${minutes} ${hours} * * ${dayOfWeek}`;

    scheduleLib.scheduleJob(scheduleId, {rule:`${minutes} ${hours} * * ${dayOfWeek}`, tz: DEFAULT_TIMEZONE}, async () => {
      //const users = await User.find({ status: true, is_deleted: false, device_token: { $nin: [null, ''] } }, 'device_token');
	       let users;
			if(getData.to === 'to_specific'){
			   users = await User.find({ _id:{ $in:getData.users},status: true, is_deleted: false, device_token: { $nin: [null, ''] } }, 'device_token');
	
			}else{
			   users = await User.find({ status: true, is_deleted: false, device_token: { $nin: [null, ''] } }, 'device_token');
	
			}
			
      const chunks = _.chunk(users, 500);


      const promises = chunks.map((u) => {
        const tokens = [];

        u.forEach((item) => {
          if (item.device_token) {
            tokens.push(item.device_token);
          }
        });

        const payload = {
          tokens,
          title: data.notification.title,
          body: data.notification.body,
          picture: data.notification.picture,
        };
        return firebaseUser.sendMulticastNotification(payload);
      });

      const getsendData = await Promise.all(promises);
      if (getsendData) {
        const getSchNotify = await ScheduledNotification.findById(scheduleId);
        if (getSchNotify) {
          getsendData.forEach(async (r) => {
            // update
            const successCount = getSchNotify.send_total.success_count;
            const failedCount = getSchNotify.send_total.failed_count;
            const update = {
              send_total: {
                success_count: (successCount) ? (successCount + r.successCount) : r.successCount,
                failed_count: (failedCount) ? (failedCount + r.successCount) : r.failureCount,
              },
            };
            return await ScheduledNotification.updateOne({ _id: scheduleId }, update);
          });
        }
      }
    });
  } catch (e) {
    console.log('asdasd', e);
    throw e;
  }
};

schedule.reSchedule = async function () {
  try {
	  console.log("----------- reSchedule notifications ----------------")


	
	const scheduledNotifications = await ScheduledNotification.find({ to: { $in: ['to_all','to_specific']} });
	const getSetting = await Setting.findOne({},"general");
	let timeZone = getSetting.general.timezone;


   scheduledNotifications.forEach((scheduledNotification) => {
      const dayOfWeek = scheduledNotification.days.join(',');
	  	// Parse the input date-time in UTC
      const parsedDateTime = moment.utc(scheduledNotification.time);

      const timeToSent =  parsedDateTime.tz(timeZone).format("HH:mm").split(':');

      const hours = timeToSent[0];
      const minutes = timeToSent[1];

      const scheduleId = scheduledNotification._id.toString();
	 
	scheduleLib.scheduleJob(scheduleId,{rule:`${minutes} ${hours} * * ${dayOfWeek}`, tz: timeZone}, async () => {
		

			let users;
			if(scheduledNotification.to === 'to_specific'){
			   users = await User.find({ _id:{ $in:scheduledNotification.users},status: true, is_deleted: false, device_token: { $nin: [null, ''] } }, 'device_token');
	
			}else{
			   users = await User.find({ status: true, is_deleted: false, device_token: { $nin: [null, ''] } }, 'device_token');
	
			}
			
			console.log("users",users);
      
        const chunks = _.chunk(users, 500);

        const promises = chunks.map((u) => {
          const tokens = [];

          u.forEach((item) => {
            if (item.device_token) {
              tokens.push(item.device_token);
            }
          });

          const payload = {
            tokens,
            title: scheduledNotification.notification.title,
            body: scheduledNotification.notification.body,
            picture: scheduledNotification.notification.picture,
          };
          return firebaseUser.sendMulticastNotification(payload);
        });

        const getsendData = await Promise.all(promises);

        if (getsendData) {
          const getSchNotify = await ScheduledNotification.findById(scheduleId);
          if (getSchNotify) {
            getsendData.forEach(async (r) => {
              // update
              const successCount = getSchNotify.send_total.success_count;
              const failedCount = getSchNotify.send_total.failed_count;
              const update = {
                send_total: {
                  success_count: (successCount) ? (successCount + r.successCount) : r.successCount,
                  failed_count: (failedCount) ? (failedCount + r.successCount) : r.failureCount,
                },
              };
              return await ScheduledNotification.updateOne({ _id: scheduleId }, update);
            });
          }
        }
      });
    });
  } catch (e) {
	  console.log(e);
    throw e;
  }
};

module.exports = schedule;
