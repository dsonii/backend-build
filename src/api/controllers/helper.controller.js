const httpStatus = require('http-status');
const Helper = require('../models/helper.model');
const Reply = require('../models/reply.model');
const User = require('../models/user.model');
//const userFCM = require("../notifications/user")
const firebaseUser = require('../services/firebaseUser');
const userNotification = require("../models/userNotification.model")
const mongoose = require('mongoose');

/**
 * Get location list
 * @public
 */



exports.list = async (req, res, next) => {
  try {
    // const locations = await Location.list(req.query);
    // const transformedUsers = locations.map(location => location.transform());
    let condition = req.query.global_search
      ?
      {
        $or: [
          { ticket_no: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
          { firstname: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
          { lastname: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
          { email: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
          { gender: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
          // { phone:  { $regex: new RegExp(req.query.global_search), $options: 'i' } },
          { helpemail: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
          // { contact:  { $regex: new RegExp(req.query.global_search), $options: 'i' } }
        ],
      }
      : {};

    let sort = {};
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = { [data.name]: (data.order != 'none') ? data.order : 'asc' };
    }

    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);
      condition = { [filtersData.name]: filtersData.selected_options[0] }
    }


    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: 'en' },
      customLabels: {
        totalDocs: 'totalRecords',
        docs: 'helpers',
      },
      sort,
      lean: true,
    };

    const result = await Helper.paginate(condition, paginationoptions);
    // console.log('result.helpers', result.helpers);
    result.helpers = Helper.transformDataLists(result.helpers)
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};


exports.reply = async (req, res, next) => {
  try {
    let helperId = req.params.helperId
    const { adminId, email, title, content, type } = req.body;
	const getHelper = await Helper.findById(helperId);
    if (getHelper) {
		console.log("getHelper",getHelper);
      if (await User.exists({ email })) {
        let getUser = await User.findOne({ email }).lean();
        if (getUser) {
          let userId = getUser._id;
          if (type === 'notification') {
            const saveObj = {
              adminId,
              helperId,
              userId,
              title,
              content
            }
            const saveReply = await new Reply(saveObj).save();
            if (saveReply) {
              if (getUser && getUser.device_token) {
				let title = `Help and Support: ${saveReply.title} `
				let body = `Ticket no: ${getHelper.ticket_no}\n${saveReply.content}`;
				const payload = {
					    token : getUser.device_token,
						title,
						body,
						picture: '',
				}
				await firebaseUser.sendSingleMessage(payload);
                userNotification.create('support',title, body, userId, adminId, {
                  helperId: helperId,
                  replyId: saveReply._id
                });
              }
              res.status(httpStatus.CREATED);
              res.json({
                message: `Reply sent successfully.`,
                data: {},
                status: true,
              });
            }
          } else if (type === 'sms') {


          }
        } else {
          res.status(httpStatus.OK);
          res.json({
            message: "Customer not found.",
            status: false,
          });
        }

      } else {
        res.status(httpStatus.OK);
        res.json({
          message: "Customer not found.",
          status: false,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: "Ticket not found.",
        status: false,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Helper
 * @public
 */
exports.remove = (req, res, next) => {
  Helper.deleteOne({ _id: req.params.helperId })
    .then(async () => {
		await userNotification.deleteOne({helperId:mongoose.Types.ObjectId(req.params.helperId)});
		await Reply.deleteOne({helperId:mongoose.Types.ObjectId(req.params.helperId)})
	  res.status(httpStatus.OK).json({
      status: true,
      message: 'Deleted successfully.',
    }) } )
    .catch(e => next(e));
};
