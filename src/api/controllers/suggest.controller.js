const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Suggest = require("../models/suggest.model");



/**
 * Get role
 * @public
 */
 exports.get = async (req, res) => {
  try {
    const suggest = await Suggest.findById(req.params.suggestId).populate({path:'userId',select:"firstname lastname"}).lean();
    res.status(httpStatus.OK);
    res.json({
      message: "Suggest fetched successfully.",
      data: Suggest.transformSingleData(suggest), 
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get bsu layout list
 * @public
 */
 exports.list = async (req, res, next) => {
  try {
    let condition = req.query.global_search
    ?
    {
      $or: [
        { 'pickup.address': { $regex: new RegExp(req.query.global_search), $options: 'i' } },
        { 'drop.address': { $regex: new RegExp(req.query.global_search), $options: 'i' } },
      ],
    }
    : {};

  let sort = {};
  let populatesort = { _id: -1 };
  if (!req.query.sort) {
    sort = { _id: -1 };
  } else {
    const data = JSON.parse(req.query.sort);
      if(data.name != 'userId_firstname'){
        const newsort = data.name
        sort = { [newsort.replace('_','.')]: (data.order != 'none') ? data.order : 'asc' };
      }else{
        const newsort = data.name
        populatesort = { 'firstname': (data.order != 'none') ? data.order : 'asc' };
      }

  }


     if (req.query.filters) {
            let filtersData = JSON.parse(req.query.filters)
            console.log("filtersData", filtersData)
            if (filtersData.type == "date") {
                condition = {
                    createdAt: {
                        $gte: new Date(filtersData.value.startDate),
                        $lte: new Date(filtersData.value.endDate)
                    }
                }
            }
        }
        
   
  const paginationoptions = {
    page: req.query.page || 1,
    limit: req.query.per_page || 10,
    collation: { locale: 'en' },
    customLabels: {
      totalDocs: 'totalRecords',
      docs: 'suggests',
    },
    sort,
    populate:[
      {path:"userId",select:"firstname lastname",options: { sort: populatesort }},
    ],
    lean: true,
  };

  const result = await Suggest.paginate(condition, paginationoptions);
  result.suggests = Suggest.transformData(result.suggests)
  res.json({ data: result });
  }catch(error){
    next(error);
  }
}
