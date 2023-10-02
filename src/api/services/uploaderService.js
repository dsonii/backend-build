const {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../../config/s3Client");
const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const CDNURL = process.env.CDN_URL;
const fs = require("fs");
const sharp = require("sharp");
/**
 *
 * @param  {string}  base64 Data
 * @return {string}  Image url
 */
module.exports = {
  imageUpload: async (base64, filename, folderName) => {
    // console.log('1212 ',base64, userId, folderName)
    // Ensure that you POST a base64 data to your server.
    // Let's assume the variable "base64" is one.
    if (base64 && base64.includes("base64")) {
      base64Data = new Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
    } else {
      base64Data = new Buffer.from(base64);
    }

    // Getting the file type, ie: jpeg, png or gif
    const type = "png"; // base64.split(';')[0].split('/')[1];
    const bucketParams = {
      Bucket: `${BUCKET_NAME}`, // drivers/Profiles
      Key: `${folderName}/${filename}.${type}`, // type is not required
      Body: base64Data,
      ACL: "public-read",
      ContentEncoding: "base64", // required
      ContentType: `image/${type}`, // required. Notice the back ticks
    };

    let location = "";
    let key = "";
    try {
      await s3Client.send(new PutObjectCommand(bucketParams)); // await s3Client.upload(params).promise();
      const cdnURL = `${CDNURL}/${folderName}/${filename}.${type}`;
      //const cdnURL = response.$metadata.httpHeaders['x-amz-cf-id'];

      // location = Location;
      // key = Key;
      //   console.log('location',location,key)
      return cdnURL;
    } catch (error) {
      console.log("s3 error", error);
    }

    // Save the Location (url) to your database and Key if needs be.
    // As good developers, we should return the url and let other function do the saving to database etc
    // console.log(location, key);

    return location;
  },
  fileUpload: async (fileData, filename, folderName) => { // upload file the digial ocean spaces 
    try {
      const fileExt = fileData.name.split(".").pop();
      const bucketParams = {
        Bucket: `${BUCKET_NAME}`, // drivers/Profiles
        ContentType: fileData.mimetype,
        Key: `${folderName}/${filename}.${fileExt}`, // type is not required
        Body: fileData.data,
        ACL: "public-read",
      };

      await s3Client.send(new PutObjectCommand(bucketParams)); // await s3Client.upload(params).promise();
      const cdnURL = `${CDNURL}/${folderName}/${filename}.${fileExt}`;
      return cdnURL;
    } catch (error) {
      console.log("s3 error", error);
    }
  },
  imageDelete: async (imageName, folderName) => {
    try {
      let key = "";
      let bucketParams = {};
      const regex =
        /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
      if (!regex.test(imageName)) {
        key = imageName;
        bucketParams = {
          Bucket: `${BUCKET_NAME}`,
          Key: `${folderName}/${key}`,
        };
      } else {
        const parsedUrl = require("url").parse(imageName);
        key = parsedUrl.pathname.substring(1).split("/");
        console.log(" key ", key);
        bucketParams = {
          Bucket: `${BUCKET_NAME}`,
          Key: `${folderName}/${key[2]}`,
        };
      }

      const deleteObject = await s3Client.send(
        new DeleteObjectCommand(bucketParams)
      );
      //   const deleteObject = await s3Client.deleteObject(params).promise();
      return deleteObject;
    } catch (err) {
      console.log("errr12", err);
      return err;
    }
  },
  resizeUpload: async (isProfile, base64Data, width, height) => {
    try {
      if (isProfile) {
        const resizeImage = await sharp(Buffer.from(base64Data, "base64"))
          .resize(width, height)
          .sharpen()
          .toBuffer();
        return resizeImage;
      }
      const resizeImage = await sharp(
        Buffer.from(base64Data, "base64")
      ).toBuffer();
      return resizeImage;
    } catch (err) {
      console.log("errr12", err);
      return err;
    }
  },
};
