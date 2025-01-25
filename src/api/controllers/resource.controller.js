const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Resource = require("../models/resource.model");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const slug = require('slug')



/**
 * Load user and append to req.
 * @public
 */
 exports.load = async (req, res, next) => {
  try {
    const resource = await Resource.find({},"name slug");
    res.status(httpStatus.OK);
    res.json({
      message: 'Resource Type load data.',
      data: Resource.transformLoad(resource),
      status: true,
    });
  } catch (error) {
    return next(error);
  }
};


/**
 * Get resource
 * @public
 */
 exports.get = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    res.status(httpStatus.OK);
    res.json({
      message: "Resource fetched successfully.",
      data: Resource.transformSingleData(resource),
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
    const condition = req.query.global_search
    ?
    {
      $or: [
        { name: { $regex: new RegExp(req.query.global_search), $options: 'i' } },
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

  //    console.log('1212', sort);
  const paginationoptions = {
    page: req.query.page || 1,
    limit: req.query.per_page || 10,
    collation: { locale: 'en' },
    customLabels: {
      totalDocs: 'totalRecords',
      docs: 'resources',
    },
    sort,
    lean: true,
  };

  const result = await Resource.paginate(condition, paginationoptions);
  result.resources = Resource.transformData(result.resources)
  res.json({ data: result });
  }catch(error){
    next(error);
  }
}



/**
 * Create new resource
 * @public
 */
 exports.create = async (req, res, next) => {
  try {

    const { name,resources_roles} = req.body;
    const obj = {
      name,
      slug:slug(name),
      resources_roles
    }
    const resource = new Resource(obj);
    const savedResource = await resource.save();
    res.status(httpStatus.CREATED);
    res.json({ message: 'Resource created successfully.', status: true });
  } catch (error) {
    next(error);
  }
};




/**
 * Update existing bus type
 * @public
 */
 exports.update =async (req, res, next) => {
  try {
    const updateresource = await Resource.findByIdAndUpdate(req.params.resourceId,{
      $set: {
        name: req.body.name,
        slug: slug(req.body.name),
        resources_roles: req.body.resources_roles
      },
    }, {
      new: true,
    });
    const transformedResource = updateresource.transform();
    res.json({ message: 'Resource updated successfully.',data:transformedResource,status:true});
  } catch (error) {
    next(error);
  }
};





/**
 * Delete bus type
 * @public
 */
 exports.remove = (req, res, next) => {
  Resource.deleteOne({
    _id: req.params.resourceId,
  })
    .then(() => res.status(httpStatus.OK).json({
      status: true,
      message: 'Resource deleted successfully.',
    }))
    .catch(e => next(e));
};
