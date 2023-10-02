// You can either "yarn add aws-sdk" or "npm i aws-sdk"
//const AWS = require('aws-sdk');
const { S3Client, AbortMultipartUploadCommand } = require("@aws-sdk/client-s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Configure AWS to use promise
// AWS.config.setPromisesDependency(require('bluebird'));
// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_DEFAULT_REGION,
// });

// Create an s3 instance
const s3Client = new S3Client({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: "https://nyc3.digitaloceanspaces.com",
  region: process.env.AWS_DEFAULT_REGION, //"us-east-1",
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
  }
});

/**
 *
 * @param  {string}  base64 Data
 * @return {string}  Image url
 */
module.exports = {
    imageUpload: async(base64, userId, folderName) => {
        // console.log('1212 ',base64, userId, folderName)
        // Ensure that you POST a base64 data to your server.
        // Let's assume the variable "base64" is one.
        const base64Data = new Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');

        // Getting the file type, ie: jpeg, png or gif
        const type = 'png'; // base64.split(';')[0].split('/')[1];
        const params = {
            Bucket: `${BUCKET_NAME}/${folderName}`, // drivers/Profiles
            Key: `${userId}.${type}`, // type is not required
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64', // required
            ContentType: `image/${type}`, // required. Notice the back ticks
        };


        let location = '';
        let key = '';
        try {
            const {
                Location,
                Key,
            } = await s3Client.upload(params).promise();
            location = Location;
            key = Key;
            //   console.log('location',location,key)
            return location;
        } catch (error) {
            console.log('s3 error', error)
        }

        // Save the Location (url) to your database and Key if needs be.
        // As good developers, we should return the url and let other function do the saving to database etc
        // console.log(location, key);

        return location;
    },
    imageDelete: async(imageName, folderName) => {
        try {
            let key = '';
            let params = {}
            const regex =
                /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
            if (!regex.test(imageName)) {
                key = imageName;
                params = {
                    Bucket: `${BUCKET_NAME}/${folderName}`,
                    Key: key,
                };
            } else {
                const parsedUrl = require("url").parse(imageName);
                key = parsedUrl.pathname.substring(1).split('/')
                console.log(" key ", key)
                params = {
                    Bucket: `${BUCKET_NAME}/${folderName}`,
                    Key: key[2],
                };
            }

            const deleteObject = await s3Client.deleteObject(params).promise();
            return deleteObject;
        } catch (err) {
            console.log('errr12', err)
            return err;
        }
    }
};
