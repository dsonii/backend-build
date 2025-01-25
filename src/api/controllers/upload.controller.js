const s3 = require("../../config/s3");
const uuidv4 = require("uuid/v4");
var base64Img = require('base64-img');
/**
 * Get store upload
 * @public
 */
exports.store = async(req, res, next) => {
    try {
        const type = req.params.type;
        const image = req.files.image.data.toString('base64'); // convert to base64
        const base64 = `data:${req.files.image.mimetype};base64,${image}`;
        // merge to base64
        const uploaded = await s3.imageUpload(
            base64,
            `${type}-${uuidv4()}`,
            type
        );

        res.json({
            message: `${type} created successfully.`,
            data: uploaded,
            status: true,
        });
    } catch (error) {
        console.log(error)
        next(error);
    }
};


/**
 * Get store upload
 * @public
 */
exports.remove = async(req, res, next) => {
    try {
        const { type, pictureUrl } = req.body
        const uploaded = await s3.imageDelete(pictureUrl, type);
        res.json({
            message: `${type} deleted successfully.`,
            data: uploaded,
            status: true,
        });
    } catch (error) {
        console.log(error)
        next(error);
    }
}