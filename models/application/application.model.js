const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        name: {
            type: String
        },
        price: {
            type: Number
        },
        creator: {
            type: String
        },
        route: {
            type: String
        },
        imgSrc: {
            type: String
        },
        videoSrc: {
            type: String
        },
        tags: [String],
        intro: {
            type: String
        },
        features:[String],
        createdAt: {
            type: Date,
            default: new Date(),
        }
    },
    {
        toJSON: {
          virtuals: true,
        },
        toObject: {
          virtuals: true,
        },
    }
);


const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;