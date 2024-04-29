const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { S3Client, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

AWS.config.update({
    region: 'ap-northeast-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3Client = new S3Client();

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.webp'];

const imageUploader = multer({
    storage: multerS3({
        s3: s3Client,
        acl: 'public-read-write',
        bucket: 'aria-academy',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: async (req, file, callback) => {
            const uploadDirectory = req.query.directory ?? '';
            const extension = path.extname(file.originalname);
            const uniqueIdentifier = Date.now();
            if (!allowedExtensions.includes(extension)) {
                return callback(new Error('wrong extension'))
            }
            callback(null, `${uploadDirectory}/${uniqueIdentifier}_${file.originalname}`)
        },
    })
});

module.exports = imageUploader;