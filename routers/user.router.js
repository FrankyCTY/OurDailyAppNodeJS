const express = require("express");
const validate = require("../validators/validate");
const authController = require("../controllers/auth/auth.controller");
const {signUpValidation} = require("../validators/user.validator");

const router = express.Router();

// Client Routes
router.post("/signup", signUpValidation, validate, authController.signUp);


module.exports = router;