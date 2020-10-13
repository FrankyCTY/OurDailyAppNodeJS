const { s3 } = require("../../config/AWS");
const User = require("../../models/user/user.model");
const QueryStringHandler = require("../../helpers/QueryStringHandler");
const withCatchErrAsync = require("../../utils/error/withCatchErrorAsync");
const OperationalErr = require("../../helpers/OperationalErr");
const { filterObj, upload, deleteOldAvatarFromS3, uploadAvatarToS3 } = require("./user.utils");
const sharp = require("sharp");

exports.uploadUserAvatar = upload.single("avatar");

exports.resizeUserPhoto = withCatchErrAsync(async (req, res, next) => {
  // Multer's upload middleware puts the file into req
  if (!req.file) {
    console.log("not file found")
    return next();}

  const { id } = req.user;

  req.file.filename = `user-${id}-${Date.now()}.jpeg`;

  const imgBuffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  req.file.resizedImgBuffer = imgBuffer;

  return next();
});

// @desc    Allow admin to get all user info with queryString filtering
// @private
// @restrictTo only admin
exports.getAllUsers = withCatchErrAsync(async (req, res, next) => {
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


// Please use updateMe with deleteOldAvatarFromS3
// updateMe itself will not return any response
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

  // track if any errors happen in s3
  // const s3Error = false;

  // Only update aws if req.file exists
  if(req.file) {
    const { filename, resizedImgBuffer } = req.file;
    const imgBuffer = resizedImgBuffer;

    uploadAvatarToS3(filename, imgBuffer);
  }
  
  // 3) Update in database
  // Procced only if S3 doesn't report errors
  // if(s3Error) {
  //   return next(new OperationalErr("AWS server error", 500, "local"));
  // }
  // else {
    const filteredReqBody = filterObj(req.body, ["name", "email", "birthday"]);
    if (req.file) {
      filteredReqBody.photo = req.file.filename;
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredReqBody,
      {
        new: true,
        // runValidators: true,
      }
    );

    // 3A) Delete old avatar from s3 bucket
    deleteOldAvatarFromS3(req.user.photo);

    // 3B) Send Response
    return res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  // }
});

exports.getS3Image = withCatchErrAsync(async (req, res, next) => {
    const {imageId} = req.params;
    console.log("get S3 Image", imageId);
    // Get image from AWS S3 bucket
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageId,
    };
    
    // Get image using my aws confidentials
    setTimeout(() => {
      s3.getObject(params, (error, data) => {
        if (error) {
          console.log(error);
          return next(new OperationalErr("Error getting image from aws", 500, "local"))
        }
        return res.status(200).json({
          status: "success",
          data: {
            image: data.Body,
          }
        })
      });

    }, 2000);
    // console.log({result});
})

exports.getAppInCart = withCatchErrAsync(async (req, res, next) => {
  const {_id} = req.user;
  const userDoc = await User.findById(_id).populate({path: 'applicationsInCart', select: {'name': 1, 'createdAt': 1, 'imgSrc': 1, 'price': 1, 'route': 1, 'creator': 1}});

  const appInCartDocs = userDoc.applicationsInCart

  return res.status(200).json({
    status: "success",
    result: appInCartDocs.length,
    data: {
      apps: appInCartDocs
    }
  })
})

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
