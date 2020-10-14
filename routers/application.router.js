const express = require("express");
const validate = require("../validators/validate");
const applicationController = require("../controllers/application/application.controller");
const authController = require("../controllers/auth/auth.controller");
const {applicationValidation} = require("../validators/application.validator");

const router = express.Router();


router.route("/").post(applicationValidation, validate, applicationController.createApplicationDetails).get(applicationController.getAllApplications);

// @Public
router.get("/:applicationId", applicationController.getApplicationDetails);

// @Private
//======= Cart ========
router.route("/:applicationId/addToCart").patch(authController.protect, applicationController.addAppToCart);
router.route("/:applicationId/deleteFromCart").delete(authController.protect, applicationController.deleteFromCart);
router.route("/updateAppsInCart").post(authController.protect, applicationController.updateAppsInCart);

//======= Wishlist ========
router.route("/:applicationId/addAppToWishlist").patch(authController.protect, applicationController.addAppToWishlist);
router.route("/:applicationId/deleteFromWishlist").delete(authController.protect, applicationController.deleteFromWishlist);
router.route("/updateAppsInWishlist").post(authController.protect, applicationController.updateAppsInWishlist);










module.exports = router;