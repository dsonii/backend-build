const Payment = require('../models/payment.model');
const Booking = require('../models/booking.model');

const paymentChart = async (start_date, end_date, condition) => {
  try {
    const FIRST_MONTH = 1;
    const LAST_MONTH = 12;
    const TODAY = start_date; // moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const YEAR_BEFORE = end_date; // moment().subtract(1, 'years').format("YYYY-MM-DD");
    // console.log("TODAY", TODAY);
    // console.log("YEAR_BEFORE", YEAR_BEFORE);
    const MONTHS_ARRAY = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const data = await Payment.aggregate([
      {
        $match: condition,
      },
      {
        $group: {
          _id: { year_month: { $substrCP: ['$createdAt', 0, 7] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year_month': 1 },
      },
      {
        $project: {
          _id: 0,
          count: 1,
          month_year: {
            $concat: [
              {
                $arrayElemAt: [
                  MONTHS_ARRAY,
                  {
                    $subtract: [
                      { $toInt: { $substrCP: ['$_id.year_month', 5, 2] } },
                      1,
                    ],
                  },
                ],
              },
              '-',
              { $substrCP: ['$_id.year_month', 0, 4] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { k: '$month_year', v: '$count' } },
        },
      },
      {
        $addFields: {
          start_year: { $substrCP: [YEAR_BEFORE, 0, 4] },
          end_year: { $substrCP: [TODAY, 0, 4] },
          months1: {
            $range: [
              { $toInt: { $substrCP: [YEAR_BEFORE, 5, 2] } },
              { $add: [LAST_MONTH, 1] },
            ],
          },
          months2: {
            $range: [
              FIRST_MONTH,
              { $add: [{ $toInt: { $substrCP: [TODAY, 5, 2] } }, 1] },
            ],
          },
        },
      },
      {
        $addFields: {
          template_data: {
            $concatArrays: [
              {
                $map: {
                  input: '$months1',
                  as: 'm1',
                  in: {
                    count: 0,
                    month_year: {
                      $concat: [
                        {
                          $arrayElemAt: [
                            MONTHS_ARRAY,
                            { $subtract: ['$$m1', 1] },
                          ],
                        },
                        '-',
                        '$start_year',
                      ],
                    },
                  },
                },
              },
              {
                $map: {
                  input: '$months2',
                  as: 'm2',
                  in: {
                    count: 0,
                    month_year: {
                      $concat: [
                        {
                          $arrayElemAt: [
                            MONTHS_ARRAY,
                            { $subtract: ['$$m2', 1] },
                          ],
                        },
                        '-',
                        '$end_year',
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          years_data: {
            $map: {
              input: '$template_data',
              as: 't',
              in: '$$t.month_year',
            },
          },
          data: {
            $map: {
              input: '$template_data',
              as: 't',
              in: {
                $reduce: {
                  input: '$data',
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ['$$t.month_year', '$$this.k'] },
                      { $add: ['$$this.v', '$$value'] },
                      { $add: [0, '$$value'] },
                    ],
                  },
                },

              },
            },
          },
        },
      },
      {
        $project: {
          years_data: '$years_data',
          data: '$data',
          _id: 0,
        },
      },
    ]);
    return data;
  } catch (err) {
    return false;
  }
};


const bookingChart = async (start_date, end_date, condition) => {
  try {
    const FIRST_MONTH = 1;
    const LAST_MONTH = 12;
    const TODAY = start_date; // moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const YEAR_BEFORE = end_date; // moment().subtract(1, 'years').format("YYYY-MM-DD");
    // console.log("TODAY", TODAY);
    // console.log("YEAR_BEFORE", YEAR_BEFORE);
    const MONTHS_ARRAY = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const data = await Booking.aggregate([
      {
        $match: condition,
      },
      {
        $group: {
          _id: { year_month: { $substrCP: ['$booking_date', 0, 7] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year_month': 1 },
      },
      {
        $project: {
          _id: 0,
          count: 1,
          month_year: {
            $concat: [
              {
                $arrayElemAt: [
                  MONTHS_ARRAY,
                  {
                    $subtract: [
                      { $toInt: { $substrCP: ['$_id.year_month', 5, 2] } },
                      1,
                    ],
                  },
                ],
              },
              '-',
              { $substrCP: ['$_id.year_month', 0, 4] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { k: '$month_year', v: '$count' } },
        },
      },
      {
        $addFields: {
          start_year: { $substrCP: [YEAR_BEFORE, 0, 4] },
          end_year: { $substrCP: [TODAY, 0, 4] },
          months1: {
            $range: [
              { $toInt: { $substrCP: [YEAR_BEFORE, 5, 2] } },
              { $add: [LAST_MONTH, 1] },
            ],
          },
          months2: {
            $range: [
              FIRST_MONTH,
              { $add: [{ $toInt: { $substrCP: [TODAY, 5, 2] } }, 1] },
            ],
          },
        },
      },
      {
        $addFields: {
          template_data: {
            $concatArrays: [
              {
                $map: {
                  input: '$months1',
                  as: 'm1',
                  in: {
                    count: 0,
                    month_year: {
                      $concat: [
                        {
                          $arrayElemAt: [
                            MONTHS_ARRAY,
                            { $subtract: ['$$m1', 1] },
                          ],
                        },
                        '-',
                        '$start_year',
                      ],
                    },
                  },
                },
              },
              {
                $map: {
                  input: '$months2',
                  as: 'm2',
                  in: {
                    count: 0,
                    month_year: {
                      $concat: [
                        {
                          $arrayElemAt: [
                            MONTHS_ARRAY,
                            { $subtract: ['$$m2', 1] },
                          ],
                        },
                        '-',
                        '$end_year',
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          years_data: {
            $map: {
              input: '$template_data',
              as: 't',
              in: '$$t.month_year',
            },
          },
          data: {
            $map: {
              input: '$template_data',
              as: 't',
              in: {
                $reduce: {
                  input: '$data',
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ['$$t.month_year', '$$this.k'] },
                      { $add: ['$$this.v', '$$value'] },
                      { $add: [0, '$$value'] },
                    ],
                  },
                },

              },
            },
          },
        },
      },
      {
        $project: {
          years_data: '$years_data',
          data: '$data',
          _id: 0,
        },
      },
    ]);
    return data;
  } catch (err) {
    return false;
  }
};

module.exports = {
  paymentChart,
  bookingChart,
};
