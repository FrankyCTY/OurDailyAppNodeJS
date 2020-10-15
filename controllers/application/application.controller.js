const withCatchErrAsync = require("../../utils/error/withCatchErrorAsync");
const User = require("../../models/user/user.model");
const Application = require("../../models/application/application.model");
const OperationalErr = require("../../helpers/OperationalErr");
const QueryStringHandler = require("../../helpers/QueryStringHandler");
const mongoose = require("mongoose");

exports.getApplicationDetails = withCatchErrAsync(async (req, res, next) => {
    const {applicationId} = req.params;
    const appDoc = await Application.findById(applicationId);

    if(!appDoc) {
        return next(new OperationalErr("Target application does not exist", 404, "local"));
    }

    return res.status(200).json({
        status: "success",
        data: {
            application: appDoc,
        }
    })
})

exports.createApplicationDetails = withCatchErrAsync(async (req, res, next) => {
    const {name, videoSrc, imgSrc, price, route, creator, tags, intro, features} = req.body;

    const newApplication = await Application.create({
        name, videoSrc, imgSrc, price, route, creator, tags, intro, features
    })

    return res.status(200).json({
        status: "success",
        data: {
            application: newApplication,
        }
    })


})

exports.getAllApplications = withCatchErrAsync(async (req, res, next) => {
    const features = new QueryStringHandler(Application.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    
    const appDocs = await features.query;

    return res.status(200).json({
        status: "success",
        result: appDocs.length,
        data: {
            apps: appDocs,
        }
    })
})

exports.addAppToCart = withCatchErrAsync(async (req, res, next) => {
    const {applicationId} = req.params;
    const {id, applicationsInCart} = req.user;

    // 1) Check if the target application exists
    const appDoc = await Application.findById(applicationId).select({tags: 0, features: 0, videoSrc: 0, intro: 0, _v: 0});
    // console.log(appDoc._id);
    if(!appDoc) {
        return next(new OperationalErr("Application does not exist.", 400, "local"));
    }

    // 2) Check if user already added this app into cart list
    if((applicationsInCart.some(appId => appId.toString() === applicationId))) {
        return next(new OperationalErr("You have already added this into your cart.", 400, "local"))
    }

    await User.findByIdAndUpdate(id, {
        // 3) Update user with the application id adding to the cart
        $push: {
            applicationsInCart: applicationId
        },
        // 4) Delete the app from the cart because app can only be on one side.
        $pull: {
            wishlistApplications: applicationId
        }
    }, {new: true}).select("applicationsInCart");

    return res.status(200).json({
        status: "success",
        data: {
            app: appDoc
        }
    })
})

exports.addAppToWishlist = withCatchErrAsync(async(req, res, next) => {
    const {applicationId} = req.params;
    const {_id, wishlistApplications} = req.user;

    // 1) Check if the target application exists
    const appDoc = await Application.findById(applicationId).select({tags: 0, features: 0, videoSrc: 0, intro: 0, _v: 0});
    // console.log(appDoc._id);
    if(!appDoc) {
        return next(new OperationalErr("Application does not exist.", 400, "local"));
    }

    // 2) Check if user already added this app into wishlist
    if((wishlistApplications.some(appId => appId.toString() === applicationId))) {
        return next(new OperationalErr("You already have this app in the wishlist.", 400, "local"))
    } else {
        const userDoc = await User.findByIdAndUpdate(_id, {
            // 3) Update user with the application id adding to the cart
            $push: {
                wishlistApplications: applicationId
            },
            // 4) Delete the app from the cart because app can only be on one side.
            $pull: {
                applicationsInCart: applicationId
            }
        }, {new: true}).select("wishlistApplications");
    }

    
    return res.status(200).json({
        status: "success",
        data: {
            app: appDoc
        }
    })
})

exports.deleteFromCart = withCatchErrAsync(async (req, res, next) => {
    const {applicationId} = req.params;
    const {_id} = req.user;

    const updatedUserDoc = await User.findByIdAndUpdate(_id, {$pull: {applicationsInCart: applicationId}}, {new: true});

    return res.status(200).json(
    {        
        status: "success",
        result: updatedUserDoc.applicationsInCart.length,
        data: {
            apps: updatedUserDoc.applicationsInCart
        }
    }
    )
})

exports.deleteFromWishlist = withCatchErrAsync(async (req, res, next) => {
    const {applicationId} = req.params;
    const {_id} = req.user;

    const updatedUserDoc = await User.findByIdAndUpdate(_id, {
        $pull: {
            wishlistApplications: applicationId
        }
    }, {new: true});

    return res.status(200).json(
    {        
        status: "success",
        result: updatedUserDoc.applicationsInCart.length,
        data: {
            apps: updatedUserDoc.applicationsInCart
        }
    }
    )
})

exports.updateAppsInCart = withCatchErrAsync(async(req, res, next) => {
    // Notes that apps must be an array of String (app Object id)
    const {appIds} = req.body;
    const {_id} = req.user;

    // 1) apps must be an array
    if(!(Array.isArray(appIds))) {
        return next(new OperationalErr("Apps must be an array.", 400, "local"));
    }

    
    // 2) filter the apps and only accept objectId
    const filteredApps = appIds.filter(appId => mongoose.isValidObjectId(appId));
    console.log({cart: filteredApps})

    const updatedUserDoc = await User.findByIdAndUpdate(_id, {applicationsInCart: filteredApps}, {new: true});

    return res.status(200).json({
        status: "success",
        result: updatedUserDoc.applicationsInCart.length,
        data: {
            apps: updatedUserDoc.applicationsInCart
        }
    })
})

exports.updateAppsInWishlist = withCatchErrAsync(async(req, res, next) => {
    // Notes that apps must be an array of String (app Object id)
    const {appIds} = req.body;
    const {_id} = req.user;

    // 1) apps must be an array
    if(!(Array.isArray(appIds))) {
        return next(new OperationalErr("Apps must be an array.", 400, "local"));
    }

    // 2) filter the apps and only accept objectId
    const filteredApps = appIds.filter(appId => mongoose.isValidObjectId(appId));
    console.log({wl: filteredApps})
    const updatedUserDoc = await User.findByIdAndUpdate(_id, {wishlistApplications: filteredApps}, {new: true});

    return res.status(200).json({
        status: "success",
        result: updatedUserDoc.wishlistApplications.length,
        data: {
            apps: updatedUserDoc.wishlistApplications
        }
    })
})