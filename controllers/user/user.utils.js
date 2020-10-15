const multer = require("multer");
const { s3 } = require("../../config/AWS");

exports.filterObj = (bodyObj, allowedFields) => {
  const newBodyObj = {};
  Object.keys(bodyObj).forEach((key) => {
    if (allowedFields.includes(key)) newBodyObj[key] = bodyObj[key];
  });

  return newBodyObj;
};

// For avatar upload
const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith("image")) {
    callback(null, true);
  } else {
    callback(
      new OperationalErr(
        "Not an image! Please upload only images.",
        400,
        "local"
      ),
      false
    );
  }
};

const multerStorage = multer.memoryStorage();


exports.upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadAvatarToS3 = (avatarName, imgBuffer) => {
  // 2) Upload to AWS S3 bucket
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: avatarName,
    Body: imgBuffer,
  };
  
  s3.upload(params, (error, data) => {
    if (error) {
      // s3Error = true;
      // req.s3Error = true;
    }
  });
}

exports.deleteOldAvatarFromS3 = (oldAvatarName) => {

  // Do NOT delete the default.jpeg
  if(oldAvatarName === "default.jpeg" || oldAvatarName === "male.jpeg" || oldAvatarName === "female.jpeg") return;

  // Delete old avatar photo from AWS S3 bucket
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: oldAvatarName,
  };
  
  s3.deleteObject(params, (error, data) => {
    if (error) {
    }
  });
}