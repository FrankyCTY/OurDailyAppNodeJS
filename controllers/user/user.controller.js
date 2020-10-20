const User = require("../../models/user/user.model");
const {getFromS3} = require("../../utils/s3Utils");
const withCatchErrAsync = require("../../utils/error/withCatchErrorAsync");
const OperationalErr = require("../../helpers/OperationalErr");
const { filterObj, upload, deleteOldAvatarFromS3, uploadAvatarToS3 } = require("./user.utils");
const sharp = require("sharp");
const factory = require("../controllerFactory");

exports.uploadUserAvatar = upload.single("avatar");

exports.resizeUserPhoto = withCatchErrAsync(async (req, res, next) => {
  // Multer's upload middleware puts the file into req
  if (!req.file) {
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
exports.getAllUsers = factory.getAll(User);


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

  // 2) Only update aws s3 if req.file exists
  if(req.file) {
    const { filename, resizedImgBuffer } = req.file;
    const imgBuffer = resizedImgBuffer;

    await uploadAvatarToS3(filename, imgBuffer);
  }
  
    const filteredReqBody = filterObj(req.body, ["name", "email", "birthday", "bio", "personalWebsite", "gender", "imgName"]);
    // 3) Apply if user choose one of the default avatar

    let isUpdateAvatar = false;
    if(req.body.imgName)
    {
      filteredReqBody.photo = `${req.body.imgName}.jpeg`;
      isUpdateAvatar = true;
    }
    // 4) Apply if user upload his own avatar
    if (req.file) {
      filteredReqBody.photo = req.file.filename;
      isUpdateAvatar = true;
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
    if(isUpdateAvatar) {
      deleteOldAvatarFromS3(req.user.photo);
    }

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
    
    let retry = false;
    // 1) Get image using my aws confidentials
    try {
        await getFromS3(imageId, (imgBuffer) => res.status(200).json({
          status: "success",
          data: {
            image: imgBuffer,
          }
        }));
      
    } catch (error) {
      // 2a) If error is "can't find the avatar with that Key provided"
      // then we want to retry later
      if (error.statusCode === 404) {
        console.log("CAUGHT NO SUCH KEY ERROR!")
        retry = true;
      }
      // 2b) If error is other error, then we throw error respond
      if(!retry)
      {
        console.log(error);
        return next(new OperationalErr("Error getting image from aws", 500, "local"));
      } else {
        // 3) if can't find the specific avatar, then we retry with the default jpeg
        try {        
          return getFromS3("default.jpeg", (imgBuffer) => res.status(200).json({
            status: "success",
            data: {
              image: imgBuffer,
            }
          }), next);
        } catch (error) {
          console.log(error);
          return next(new OperationalErr("Error getting image from aws", 500, "local"));
        }
      }
    }
})

exports.getAppInCart = withCatchErrAsync(async (req, res, next) => {
  const {_id} = req.user;
  const userDoc = await User.findById(_id).populate({path: 'applicationsInCart', select: {'name': 1, 'createdAt': 1, 'imgSrc': 1, 'price': 1, 'route': 1, 'creator': 1}});


  // 2) Only calculate the total price if there is app in the user's cart
  let totalPriceInCart = 0;
  if(userDoc.applicationsInCart.length !== 0) {
    totalPriceInCart = userDoc.applicationsInCart.reduce((totalPrice, app) => totalPrice + app.price, 0);
  }

  console.log({totalPriceInCart})

  const appInCartDocs = userDoc.applicationsInCart

  return res.status(200).json({
    status: "success",
    result: appInCartDocs.length,
    data: {
      apps: appInCartDocs,
      totalPrice: totalPriceInCart
    }
  })
})

exports.getAppInWishlist = withCatchErrAsync(async (req, res, next) => {
  const {_id} = req.user;
  const userDoc = await User.findById(_id).populate({path: 'wishlistApplications', select: {'name': 1, 'createdAt': 1, 'imgSrc': 1, 'price': 1, 'route': 1, 'creator': 1}});

  const appInWishlistDocs = userDoc.wishlistApplications

  return res.status(200).json({
    status: "success",
    result: appInWishlistDocs.length,
    data: {
      apps: appInWishlistDocs
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
