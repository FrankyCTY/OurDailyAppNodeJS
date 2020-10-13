const {body} = require("express-validator");
const Application = require("../models/application/application.model");

exports.applicationValidation = [
    body("name").trim().isLength({
        min: 4,
        max: 30,
    }).withMessage("name{SEPERATE}Name must between 4 to 30 chars long").bail().custom((value) => {
        return Application.find({
            name: value,
        }).then(app => {
            if(app.length !== 0) {
                return Promise.reject("name{SEPERATE}Application's name already in use");
            }
        })
    }),
    body("tags").isIn(["html", "css", "javascript", "chroma.js"]).withMessage("tags{SEPERATE}Unexpected tags are not allowed"),
]