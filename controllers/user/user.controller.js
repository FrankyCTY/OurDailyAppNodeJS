const User = require("../../models/user/user.model");
const QueryStringHandler = require("../../helpers/QueryStringHandler");
const withCatchErrAsync = require("../../utils/error/withCatchErrorAsync");
const OperationalErr = require("../../helpers/OperationalErr");
const { filterObj } = require("./user.utils");
const multer = require("multer");
const sharp = require("sharp");
const { s3 } = require("../../helpers/AWS");
const multerStorage = multer.memoryStorage();

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

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserAvatar = upload.single("avatar");

exports.resizeUserPhoto = withCatchErrAsync(async (req, res, next) => {
  // Multer's upload middleware puts the file into req
  if (!req.file) return next();

  const { id } = req.user;

  req.file.filename = `user-${id}-${Date.now()}.jpeg`;

  const imgBuffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log({ imgBuffer });

  req.file.resizedImgBuffer = imgBuffer;

  next();
});

// @desc    Allow admin to get all user info with queryString filtering
// @private
// @restrictTo only admin

exports.getAllUsers = withCatchErrAsync(async (req, res, next) => {
  //   console.log({ query: req.query });
  const queryParamFeature = new QueryStringHandler(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const docs = await queryParamFeature.query;

  return res.status(200).json({
    status: "success",
    results: docs.length,
    data: {
      data: docs,
    },
  });
});

exports.updateMe = withCatchErrAsync(async (req, res, next) => {
  // 1) Create designed error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new OperationalErr(
        "Please use /users/updatePassword to update password",
        400,
        "local"
      )
    );
  }

  const { filename, resizedImgBuffer } = req.file;
  const imgBuffer = resizedImgBuffer;

  // 2) Upload to AWS S3 bucket
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Body: imgBuffer,
  };

  s3.upload(params, (error, data) => {
    if (error) {
      return next(new OperationalErr("AWS server error", 500, "local"));
    }
  });

  // 3) Update in database
  // const filteredReqBody = filterObj(req.body, ["name", "email", "birthday"]);
  // @error update
  const filteredReqBody = req.body;
  console.log({ filteredReqBody });
  if (req.file) {
    filteredReqBody.photo = req.file.filename;
  }
  console.log({ filteredReqBody });
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredReqBody,
    {
      new: true,
      // runValidators: true,
    }
  );

  return res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// @desc Allow admin to see the birthday data of the users
// @private
// @restrictTo only admin

exports.getBirthdayData = withCatchErrAsync(async (req, res, next) => {
  const birthdayStats = await User.aggregate([
    {
      $group: {
        _id: {
          $month: "$birthday",
        },
        totalUsers: {
          $sum: 1,
        }, // group every users in one statObj
        users: {
          $push: "$name",
        },
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        month: 1,
      },
    },
  ]);

  return res.status(200).json({
    status: "success",
    results: birthdayStats.length,
    data: {
      birthdayStats,
    },
  });
});
