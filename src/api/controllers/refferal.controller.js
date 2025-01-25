const UserReferral = require("../models/userReferral.model");



exports.list = async(req, res, next) => {
    try {
           let condition = req.query.global_search
      ? {
          $or: [
            {
              payment_status: {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              "user.firstname": {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              "user.lastname": {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              "user.phone": {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              "refferal.firstname": {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              "refferal.lastname": {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
            {
              "refferal.phone": {
                $regex: new RegExp(req.query.global_search),
                $options: "i",
              },
            },
          ],
          user_type: "Customer",
        }
      : {
          user_type: "Customer",
        };

    let sort = {};
    if (!req.query.sort) {
      sort = { createdAt: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = {
        [data.name]: data.order != "none" ? data.order : "asc",
      };
    }

    const aggregateQuery = UserReferral.aggregate([
      {
        $lookup: {
          from: "users",
          as: "user",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$userId"],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                firstname: 1,
                lastname: 1,
                phone: 1,
                ProfilePic: {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$ProfilePic",
                        regex: /^(http|https):\/\//,
                      },
                    },
                    "$ProfilePic",
                    {
                      $cond: [
                        {
                          $regexMatch: {
                            input: "$ProfilePic",
                            regex: /^(default):\/\//,
                          },
                        },
                        `${process.env.FULL_BASEURL}public/users/profiles/default.jpg`,
                        {
                          $concat: [
                            `${process.env.FULL_BASEURL}public/users/profiles/`,
                            "$ProfilePic",
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "users",
          as: "refferal",
          let: { refferalId: "$refferalId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$refferalId"],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                firstname: 1,
                lastname: 1,
                phone: 1,
                ProfilePic: {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$ProfilePic",
                        regex: /^(http|https):\/\//,
                      },
                    },
                    "$ProfilePic",
                    {
                      $cond: [
                        {
                          $regexMatch: {
                            input: "$ProfilePic",
                            regex: /^(default):\/\//,
                          },
                        },
                        `${process.env.FULL_BASEURL}public/users/profiles/default.jpg`,
                        {
                          $concat: [
                            `${process.env.FULL_BASEURL}public/users/profiles/`,
                            "$ProfilePic",
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: "$refferal",
      },
      { $match: condition },
      {
        $group: {
          _id: "$userId",
          days: { $first: "$days" },
          amount: {
            $first: { $concat: [DEFAULT_CURRENCY, "", {$toString:{ $sum: {$toInt:"$amount"} }}] },
          },
          start_date: {
            $first: {
              $dateToString: { format: "%Y-%m-%d", date: "$start_date" },
            },
          },
          end_date: {
            $first: {
              $dateToString: { format: "%Y-%m-%d", date: "$end_date" },
            },
          },
          pending_amount: { $first: "$pending_amount" },
          payment_status: { $first: "$payment_status" },
          createdAt: { $first: "$createdAt" },
          user: { $first: "$user" },
          referral: { $first: "$refferal" },
        },
      },
    ]);
    const options = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "referrals",
      },
      sort,
    };

    const result = await UserReferral.aggregatePaginate(
      aggregateQuery,
      options
    );

    res.json({ data: result });
    } catch (error) {
        console.log("err ", error);
        next(error);
    }
}


exports.get = async(req, res, next) => {
    try {
        let condition = req.query.global_search ? {
            $or: [
                { 'payment_status': { $regex: new RegExp(req.query.global_search), $options: 'i' } },
                { 'user.firstname': { $regex: new RegExp(req.query.global_search), $options: 'i' } },
            ],
            user_type: 'Customer',
            userId: req.query.userId
        } : {
            user_type: 'Customer',
            userId: req.query.userId
        };

        let sort = {};
        if (!req.query.sort) {
            sort = { createdAt: -1 };
        } else {
            const data = JSON.parse(req.query.sort);
            sort = {
                [data.name]: data.order != "none" ? data.order : "asc"
            };
        }

        const paginationoptions = {
            page: req.query.page || 1,
            limit: req.query.per_page || 10,
            collation: { locale: "en" },
            customLabels: {
                totalDocs: "totalRecords",
                docs: "referrals",
            },
            sort,
            populate: [{ path: "userId", select: "firstname lastname" }, { path: "refferalId", select: "firstname lastname" }], //match: { amount: {$regex:  '(\s+'+req.query.global_search+'|^'+req.query.global_search+')', $options: 'i' } }
            lean: true,
        };

        const result = await UserReferral.paginate(condition, paginationoptions);
        result.referrals = UserReferral.transformData(result.referrals);
        res.json(result);
    } catch (error) {
        console.log("err ", error);
        next(error);
    }
}