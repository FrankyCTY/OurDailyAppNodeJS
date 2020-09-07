const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const docHooks = require("./user.doc.hooks");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
    },
    photo: {
        type: String,
    },
    role: {
        type: String,
        enum: ["user", "creator", "admin"],
        default: "user",
    },
    password: {
        type: String,
        select: false,
    },
    passwordConfirm: {
        type: String,
        select: false,
    },
    gender: {
        type: String,
    },
    birthday: {
        type: Date,
    },
    passwordChangedAt: {
        type: Date,
        default: new Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    }
});

// ======================== Hooks ========================
docHooks.reEncryptPassword(userSchema);



const User = mongoose.model("User", userSchema);

module.exports = User;