const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Listeners = require("../events/Listener");
const Bus = require("../models/bus.model");
const Route = require("../models/route.model");
const busSchedule = require("../models/busSchedule.model");
const Bus_galleries = require("../models/busGallaries.model");
const Setting = require("../models/setting.model");
const {imageDelete,imageUpload, uploadLocal, deleteLocal,} = require("../services/uploaderService");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");

const uuidv4 = require("uuid/v4");


/**
 * check bus with the Plate/Registration number.
 * @public
 */
exports.isRegistrationExists = async (req, res, next) => {
  try {
    const { reg_no, name, model_no, chassis_no,type } = req.body;
    const isExists = await Bus.countDocuments({
      $or: [
        { reg_no: reg_no },
        { name: name },
        { model_no: model_no },
        { chassis_no: chassis_no },
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

/**
 * Load user and append to req.
 * @public
 */
 exports.load = async (req, res, next) => {
  try {
    const bus = await Bus.find({status:true}).populate("bustypeId");
    res.status(httpStatus.OK);
    res.json({
      message: 'Vehicle Type load data.',
      data: Bus.transformOptions(bus),
      status: true,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Load user and append to req.
 * @public
 */
 exports.loadByRoute = async (req, res, next) => {
  try {
    
    //const getTimetable = await TimeTable.find({status:true},"busId");
    //const getBusId = getTimetable.map((v) => { return v.busId });
    const getBuses = await Bus.find({}).populate("buslayoutId").lean();
    console.log("getBuses",getBuses);
    res.status(httpStatus.OK);
    res.json({
      message: 'Vehicle Type load data.',
      data: Bus.transformOptions(getBuses),
      status: true,
    });

  } catch (error) {
    console.log("error", error);
    return next(error);
  }
};

/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId).populate("adminId").populate("bustypeId");
    res.status(httpStatus.OK);
    res.json({
      message: "Bus fetched successfully.",
      data: Bus.transformData(bus),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 *  upload single  documents
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { document_type } = req.params;
    console.log(busId);
    if (!req.file) {
      res.status(httpStatus.NOT_FOUND);
      res.json({
        message: "no file to uploaded.",
        status: false,
      });
    } else if (req.file.size > 300000) {
      // 2mb size
      res.status(httpStatus.NOT_FOUND);
      res.json({
        message: "file size 3mb limit.",
        status: false,
      });
    } else {
      const FolderName = process.env.S3_BUCKET_BUS;
      const base64Image = req.file.buffer.toString("base64");
      const base64 = `data:${req.file.mimetype};base64,${base64Image}`;
      const s3Dataurl = await imageUpload(
        base64,
        `${busId}-${document_type}`,
        FolderName
      ); // upload data to aws s3
      if (s3Dataurl) {
        if (document_type == "registration") {
          const update = {
            certificate_registration: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "Pollution") {
          const update = {
            certificate_pollution: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "insurance") {
          const update = {
            certificate_insurance: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "fitness") {
          const update = {
            certificate_fitness: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "permit") {
          const update = {
            certificate_permit: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "picture") {
          const update = {
            picture: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "gallery") {
          const update = {
            image_url: s3Dataurl,
          };

          await Bus_galleries.updateOne(
            {
              busId: { $eq: busId },
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus_gallery: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        }
      } else {
        res.status(httpStatus.NOT_FOUND);
        res.json({
          message: "Bus document uploaded failed.",
          status: false,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Create new bus
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      bustypeId,
      buslayoutId,
      adminId,
      name,
      brand,
      model_no,
      chassis_no,
      picture,
      reg_no,
      amenities,
      certificate_registration,
      certificate_pollution,
      certificate_pollution_expiry_date,
      certificate_insurance,
      certificate_insurance_expiry_date,
      certificate_fitness,
      certificate_fitness_expiry_date,
      certificate_permit,
      certificate_permit_expiry_date,
      status,
    } = req.body;
    const FolderName = process.env.S3_BUCKET_BUS;
    const objBus = {
      adminId,
      bustypeId,
      buslayoutId,
      name,
      reg_no,
      brand,
      model_no,
      chassis_no,
      status,
      amenities,
      certificate_pollution_expiry_date,
      certificate_insurance_expiry_date,
      certificate_fitness_expiry_date,
      certificate_permit_expiry_date,
    };

    const isProductionS3 = await Setting.gets3();

    if (picture && (await Setting.isValidBase64(picture))) {
      if (isProductionS3.is_production) {
        objBus.picture = await imageUpload(
          picture,
          `${uuidv4()}`,
          FolderName
        );
      } else {
        objBus.picture = await uploadLocal(picture, FolderName);
      }
    }
      
      if (certificate_registration && (await Setting.isValidBase64(certificate_registration))) {
        if (isProductionS3.is_production) {
          objBus.certificate_registration = await imageUpload(
            certificate_registration,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objBus.certificate_registration = await uploadLocal(certificate_registration, FolderName);
        }
      }
    
      if (certificate_pollution && (await Setting.isValidBase64(certificate_pollution))) {
        if (isProductionS3.is_production) {
          objBus.certificate_pollution = await imageUpload(
            certificate_pollution,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objBus.certificate_pollution = await uploadLocal(certificate_pollution, FolderName);
        }
      }

      if (certificate_insurance && (await Setting.isValidBase64(certificate_insurance))) {
        if (isProductionS3.is_production) {
          objBus.certificate_insurance = await imageUpload(
            certificate_insurance,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objBus.certificate_insurance = await uploadLocal(certificate_insurance, FolderName);
        }
      }

      if (certificate_fitness && (await Setting.isValidBase64(certificate_fitness))) {
        if (isProductionS3.is_production) {
          objBus.certificate_fitness = await imageUpload(
            certificate_fitness,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objBus.certificate_fitness = await uploadLocal(certificate_fitness, FolderName);
        }
      }
   
      if (certificate_permit && (await Setting.isValidBase64(certificate_permit))) {
        if (isProductionS3.is_production) {
          objBus.certificate_permit = await imageUpload(
            certificate_permit,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objBus.certificate_permit = await uploadLocal(certificate_permit, FolderName);
        }
      }

    const bus = new Bus(objBus);
    const savedBus = await bus.save();
    Listeners.eventsListener.emit("CREATE-TICKET", savedBus._id); // event to ASSIGNED ticket to driver

    res.status(httpStatus.CREATED);
    return res.json({
      message: 'Vehicle created successfully.',
      bus: savedBus,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing bus
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const busexists = await Bus.findById(req.params.busId).exec();
    const FolderName = process.env.S3_BUCKET_BUS;
    const isProductionS3 = await Setting.gets3();
    let certificate_pollution_expiry_date = req.body.certificate_pollution_expiry_date;
    let certificate_insurance_expiry_date = req.body.certificate_insurance_expiry_date;
    let certificate_fitness_expiry_date = req.body.certificate_fitness_expiry_date;
    let certificate_permit_expiry_date = req.body.certificate_permit_expiry_date;
    if (req.body.certificate_pollution_expiry_date == "-"){
      certificate_pollution_expiry_date = "";
    }
    if (req.body.certificate_insurance_expiry_date == "-"){
      certificate_insurance_expiry_date = "";
    }
    if (req.body.certificate_permit_expiry_date == "-"){
      certificate_permit_expiry_date = "";
    }
    if (req.body.certificate_fitness_expiry_date == "-"){
      certificate_fitness_expiry_date = "";
    }
    const objUpdate = {
      adminId: req.body.adminId,
      bustypeId: req.body.bustypeId,
      buslayoutId: req.body.buslayoutId,
      name: req.body.name,
      reg_no: req.body.reg_no,
      status: req.body.status,
      brand:req.body.brand,
      model_no:req.body.model_no,
      certificate_pollution_expiry_date:certificate_pollution_expiry_date,
      certificate_insurance_expiry_date:certificate_insurance_expiry_date,
      certificate_fitness_expiry_date:certificate_fitness_expiry_date,
      certificate_permit_expiry_date:certificate_permit_expiry_date,
      chassis_no:req.body.chassis_no,
      amenities:req.body.amenities,
    };
    
    
    if (Bus.isValidBase64(req.body.picture)) {
      if ((await Setting.isValidBase64(req.body.picture))) {
        if (isProductionS3.is_production) {
          await imageDelete(busexists.picture, FolderName);
          objUpdate.picture = await imageUpload(
            req.body.picture,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objUpdate.picture = await uploadLocal(req.body.picture, FolderName);
        }
      }
    }
   
    if (Bus.isValidBase64(req.body.certificate_registration)) {
      if ((await Setting.isValidBase64(req.body.certificate_registration))) {
        if (isProductionS3.is_production) {
          await imageDelete(busexists.certificate_registration, FolderName);
          objUpdate.certificate_registration = await imageUpload(
            req.body.certificate_registration,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objUpdate.certificate_registration = await uploadLocal(req.body.certificate_registration, FolderName);
        }
      }
    }

    if (Bus.isValidBase64(req.body.certificate_pollution)) {
      
      if ((await Setting.isValidBase64(req.body.certificate_pollution))) {
        if (isProductionS3.is_production) {
          await imageDelete(busexists.certificate_pollution, FolderName);
          objUpdate.certificate_pollution = await imageUpload(
            req.body.certificate_pollution,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objUpdate.certificate_pollution = await uploadLocal(req.body.certificate_pollution, FolderName);
        }
      }
    }

    if (Bus.isValidBase64(req.body.certificate_insurance)) {
      
      if ((await Setting.isValidBase64(req.body.certificate_insurance))) {
        if (isProductionS3.is_production) {
          await imageDelete(busexists.certificate_insurance, FolderName);
          objUpdate.certificate_insurance = await imageUpload(
            req.body.certificate_insurance,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objUpdate.certificate_insurance = await uploadLocal(req.body.certificate_insurance, FolderName);
        }
      }
    }

    if (Bus.isValidBase64(req.body.certificate_fitness)) {
      
      if ((await Setting.isValidBase64(req.body.certificate_fitness))) {
        if (isProductionS3.is_production) {
          await imageDelete(busexists.certificate_fitness, FolderName);
          objUpdate.certificate_fitness = await imageUpload(
            req.body.certificate_fitness,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objUpdate.certificate_fitness = await uploadLocal(req.body.certificate_fitness, FolderName);
        }
      }
    }

    if (Bus.isValidBase64(req.body.certificate_permit)) {
      
      if ((await Setting.isValidBase64(req.body.certificate_permit))) {
        if (isProductionS3.is_production) {
          await imageDelete(busexists.certificate_permit, FolderName);
          objUpdate.certificate_permit = await imageUpload(
            req.body.certificate_permit,
            `${uuidv4()}`,
            FolderName
          );
        } else {
          objUpdate.certificate_permit = await uploadLocal(req.body.certificate_permit, FolderName);
        }
      }
    }
    const updatebus = await Bus.findByIdAndUpdate(
      req.params.busId,
      {
        $set: objUpdate,
      },
      {
        new: true,
      }
    );
 
    const transformedBus = updatebus.transform();
    res.status(httpStatus.OK);
    res.json({
      status: true,
      message: "Vehicle updated successfully.",
      data:transformedBus,
    });
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
    
    let condition = req.query.global_search
      ? {
          $and: [
            {
              $or: [
                {
                  name: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                // {
                //   max_seats: {
                //     $regex: new RegExp(req.query.global_search),
                //     $options: "i",
                //   },
                // },
                {
                  reg_no: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  brand: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  model_no: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  chassis_no: {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                {
                  'type': {
                    $regex: new RegExp(req.query.global_search),
                    $options: "i",
                  },
                },
                { status: req.query.global_search != 'inactive'}
                
              ],
            },
          ],
        }
      : { };


    let sort = {};
    if (!req.query.sort) {
      sort = { createdAt: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = { [data.name]: data.order != "none" ? data.order : "asc" };
    }


    if (req.query.filters) {
      const filtersData = JSON.parse(req.query.filters);
      if (filtersData.type == "simple") {
          condition = {
            [filtersData.name]: filtersData.text,
          };
        
      } else if (filtersData.type == "select") {
        condition = {
          [filtersData.name]: { $in: filtersData.selected_options },
        };
      }
    }

    const aggregateQuery = Bus.aggregate([
      {
        $lookup: {
          from: "admins",
          localField: "adminId",
          foreignField: "_id",
          as: "admin",
        },
      },
      {
        $unwind: {
          path: "$admin",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "bus_layouts",
          localField: "buslayoutId",
          foreignField: "_id",
          as: "buslayout",
        },
      },
      {
        $unwind: "$buslayout"
      },
      {
        $lookup: {
          from: "bus_types",
          localField: "bustypeId",
          foreignField: "_id",
          as: "bustype",
        },
      },
      {
        $unwind: "$bustype"
      },
      {
        $project:{
          ids: "$_id",
          name: 1,
          reg_no:1,
          brand: 1,
          model_no:1,
          chassis_no: 1,
          type:{ $ifNull:["$bustype.name",""]},
          layout:{ $ifNull:["$buslayout.name",""]},
          max_seats:{ $ifNull:["$buslayout.max_seats",""]},
          created_by:{ $ifNull:["$admin.firstname","-"]},
          picture: 1,
          amenities: 1,
          certificate_registration: 1,
          certificate_pollution: 1,
          certificate_pollution_expiry_date:1, 
          certificate_insurance_expiry_date:1,
          certificate_fitness_expiry_date:1,
          certificate_permit_expiry_date:1,
          certificate_insurance: 1,
          certificate_fitness:1,
          certificate_permit: 1,
          status:{
            $cond: {
              if: { $eq: ["$status", true] },
              then: "Active",
              else: "Inactive",
            },
          },
          createdAt:1
        }
      },
      {
        $match: condition,
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.per_page || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "buses",
      },
      sort,
    };

    const result = await Bus.aggregatePaginate(aggregateQuery, options);

    //    console.log('1212', sort);
    // const paginationoptions = {
    //   page: req.query.page || 1,
    //   limit: req.query.per_page || 10,
    //   collation: { locale: "en" },
    //   customLabels: {
    //     totalDocs: "totalRecords",
    //     docs: "buses",
    //   },
    //   sort,
    //   populate: [{path:"adminId",select:'firstname'},{path:"buslayoutId",select:'name max_seats'},{path:"bustypeId",select:'name'}],
    //   lean: true,
    //   leanWithId: true,
    // };
    
    
    // const result = await Bus.paginate(condition, paginationoptions);
    // result.buses = Bus.transformDataLists(result.buses);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus
 * @public
 */
exports.remove = async (req, res, next) => {
  try{
    const FolderName = process.env.S3_BUCKET_BUS;

    if(await busSchedule.exists({busId:req.params.busId})){
      res.status(httpStatus.OK).json({
        status: false,
        message: 'Remove the vehicle schedule first!',
       })

     }else if(await Bus.exists({_id:req.params.busId})){
        const busexists = await Bus.findOne({_id:req.params.busId});
        if(Bus.isValidURL(busexists.picture)){
          await imageDelete(busexists.picture,FolderName);
        }
        if(Bus.isValidURL(busexists.certificate_registration)){
          await imageDelete(busexists.certificate_registration,FolderName);
        }
        if(Bus.isValidURL(busexists.certificate_pollution)){
          await imageDelete(busexists.certificate_pollution,FolderName);
        }
        if(Bus.isValidURL(busexists.certification_insurance)){
          await imageDelete(busexists.certification_insurance,FolderName);
        }
        if(Bus.isValidURL(busexists.certificate_fitness)){
          await imageDelete(busexists.certificate_fitness,FolderName);
        }
        if(Bus.isValidURL(busexists.certificate_permit)){
          await imageDelete(busexists.certificate_permit,FolderName);
        }

      //Listeners.eventsListener.emit("REMOVE-TICKET", req.params.busId); // event to ASSIGNED ticket to driver    
      const deleteBus = await Bus.deleteOne({_id: req.params.busId});
        if(deleteBus){
          res.status(httpStatus.OK).json({
                 status: true,
                 message: 'Vehicle deleted successfully.',
            })
        }
    }

  }catch(e){
    next(e)
  }
};
