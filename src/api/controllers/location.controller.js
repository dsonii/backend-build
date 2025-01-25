const httpStatus = require("http-status");
const Location = require("../models/location.model");
const { imageDelete, imageUpload, uploadLocal, deleteLocal} = require("../services/uploaderService");
const uuidv4 = require("uuid/v4");
const { omit } = require("lodash");

const Route = require("../models/route.model");
const RouteStop = require("../models/routeStop.model");
const Setting = require("../models/setting.model");
const fs = require("fs").promises;
const path = require("path");

/**
 * check stops with the title.
 * @public
 */
exports.istitleExists = async (req, res, next) => {
  try {
    const { title } = req.body;
    const isExists = await Location.countDocuments({
      $or: [
        { title: title },
      ],
    });

     if (isExists && isExists > 1) {
      res.status(httpStatus.OK);
      res.json({
        status: false,
      });
    } else {
      res.status(httpStatus.OK);
      res.json({
        status: true,
      });
    }
  } catch (error) {
    return next(error);
  }
};

exports.load = async (req, res) => {
  try {
    const location = await Location.find({}).sort({ _id: -1 });
    res.status(httpStatus.OK);
    res.json({
      message: "stop load successfully.",
      data: Location.transformLoad(location),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const FolderName = process.env.S3_BUCKET_LOCATION;
    const location = await Location.findById(req.params.locationId);
    const files = [];
    if (location.pictures) {
      for (var i=0; i<location.pictures.length;i++){
        
        let pictures = location.pictures[i];
        let picturesResult = pictures.replace(`${process.env.FULL_BASEURL}`, '');
        let filePath = path.join(
          __dirname,
          "../../../",
          picturesResult
        );
        
        if (fs.access(filePath)) {
          var bitmap = await fs.readFile(filePath, 'base64');
          var tmp  = bitmap.toString().replace(/[“”‘’]/g,'');
          let base64 = `data:image/png;base64,${tmp}`;
          files.push({"path":base64});
          
        }
        console.log(location.pictures[i]);
      }
    }
    location.files = files;
    res.status(httpStatus.OK);
    res.json({
      message: "stop fetched successfully.",
      data: Location.transformData(location),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create new location
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { title, address, lat, lng, city, state, status, type, files } =
      req.body;
    const FolderName = process.env.S3_BUCKET_LOCATION;
    let lastIntegerId = 1;
    const lastRoute = await Location.findOne({}).sort({ 'integer_id': -1 } );
  
    lastIntegerId = ((lastRoute ? parseInt(lastRoute.integer_id) : 0) + lastIntegerId); // auto increment
    console.log(lastIntegerId);
   
    const locationObject = {
      title,
      location: {
        type: "Point",
        address,
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      city,
      state,
      type,
      status,
	  integer_id:lastIntegerId
    };
    let pictures = [];
    let abUl = "";
    let s3Dataurl = "";
    const isProductionS3 = await Setting.gets3();
    if (files && files.length > 0) {
      if (isProductionS3.is_production) {
        for( let i = 0; i < files.length; i++ ) {
          s3Dataurl = await imageUpload(
            files[i].path.path,
            `${uuidv4()}`,
            FolderName
          );
          pictures.push(s3Dataurl);     
       }
      } else {
        for( let i = 0; i < files.length; i++ ) {
          abUl = await uploadLocal(files[i].path, FolderName);  
          pictures.push(abUl);     
       }
      }
    }
    locationObject.pictures = pictures;

    const location = await new Location(locationObject).save();
    res.status(httpStatus.CREATED);
    res.json({
      message: "Stop created successfully.",
      location: location.transform(),
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing location
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const { title, address, lat, lng, city, state, status, type, files } = req.body;
    const FolderName = process.env.S3_BUCKET_LOCATION;
    const updateObj = {
      title: title,
      location: {
        type: "Point",
        address: address,
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      city: city,
      state:state,
      type: type,
      status: status == "true",
    }
    const isProductionS3 = await Setting.gets3();
    let pictures = [];
    let abUl = "";
    let s3Dataurl = "";
    if (files && files.length > 0) {
      if (isProductionS3.is_production) {
        for( let i = 0; i < files.length; i++ ) {
          s3Dataurl = await imageUpload(
            files[i].path.path,
            `${uuidv4()}`,
            FolderName
          );
          pictures.push(s3Dataurl);     
       }
      } else {
        for( let i = 0; i < files.length; i++ ) {
          abUl = await uploadLocal(files[i].path, FolderName);  
          pictures.push(abUl);     
       }
      }
      updateObj.pictures = pictures;
    }
    const updatelocations = await Location.findByIdAndUpdate(
      req.params.locationId,
      {
        $set: updateObj,
      },
      {
        new: true,
      }
    );
    const transformedUsers = updatelocations.transform();
    res.status(httpStatus.CREATED);
    res.json({
      message: "Stop updated successfully.",
      location: transformedUsers,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    // const locations = await Location.list(req.query);
    // const transformedUsers = locations.map(location => location.transform());
    let condition = req.query.global_search
      ? {
          $or: [
            {
              title: {
                $regex:
                  "(s+" +
                  req.query.global_search +
                  "|^" +
                  req.query.global_search +
                  ")",
                $options: "i",
              },
            },
			{
              integer_id: parseInt(req.query.global_search)
            }
            // { type: req.query.global_search },
          ],
        }
      : {};

    let sort = {};
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = { [data.name]: data.order != "none" ? data.order : "asc" };
    }

    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);
      condition = { [filtersData.name]: filtersData.selected_options[0] };
    }

    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "locations",
      },
      sort,
      lean: true,
    };

    const result = await Location.paginate(condition, paginationoptions);
    result.locations = Location.transformDataLists(result.locations);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { search, type } = req.query;
    const condition = search
      ? {
          // $or: [
          title: { $regex: `(\s+${search}|^${search})`, $options: "i" },
          type,
          // { 'location.address': { $regex: new RegExp(search), $options: 'i' } },
          //  ],
        }
      : { type: type };
    const result = await Location.find(condition).lean();
    console.log("result", result);
    res.json({
      total_count: result.length,
      items: Location.formatLocation(result),
    });
  } catch (error) {
    next(error);
  }
};


exports.searchLocation = async (req, res, next) => {
  try {
    const { search, type } = req.query;
    const condition = {
          title: { $regex: `(\s+${search}|^${search})`, $options: "i" }
        };
    const result = await Location.find(condition).lean();
    console.log("result", result);
    res.json({
      total_count: result.length,
      items: Location.formatLocation(result),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete location
 * @public
 */
exports.remove = (req, res, next) => {
  RouteStop.exists({ stopId: req.params.locationId }).then((result) => {
    if (result) {
      res.status(httpStatus.OK).json({
        status: false,
        message: "Remove the stop from route first!",
      });
    } else {
      Location.deleteOne({ _id: req.params.locationId })
        .then(() =>
          res.status(httpStatus.OK).json({
            status: true,
            message: "stop deleted successfully.",
          })
        )
        .catch(e => next(e));
    }
  });
};
