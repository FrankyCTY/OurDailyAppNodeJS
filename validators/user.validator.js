const {body} = require("express-validator");
const User = require("../models/user/user.model");

exports.signUpValidation = [
    body("name").trim().isLength({min: 2, max: 20}).withMessage("Name must between 2 to 20 chars long"),
    body("email").isEmail().withMessage("Please provide an email.").bail().custom(value => {
        return User.find({email: value}).then(user => {
            if(user.length !== 0) {
                return Promise.reject("E-mail already in use");
            }
        });
    }),
    body("password").isLength({min: 8}).withMessage("Password must be at least 8 chars long"),
    body("passwordConfirm").custom((value, {req}) => {
        if(value !== req.body.password) {
            throw new Error("Password confimation does not match password");
        }
        return true;
    }),
    body("gender").isIn(["Male", "Female"]).withMessage(`Gender must be "Male" or "Female" only`),
    body("birthday").not().isEmpty().withMessage("Please provide your birthday"),
]