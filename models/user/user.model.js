const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const docHooks = require("./user.doc.hooks");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    ownedApplications: [
      {          
        type: mongoose.Schema.ObjectId,
        ref: "Application"
      }
    ],
    wishlistApplications: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Application"
      }
    ],
    applicationsInCart: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Application"
      }
    ],
    photo: {
      type: String,
      default: "default.jpeg",
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
    bio: {
      type: String,
      default: "",
    },
    personalWebsite: {
      type: String,
      default: "",
    },
    birthday: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      default: new Date(),
    },
    createdAt: {
      type: Date,
      default: new Date(),
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    isOauthAccount: {
      type: Boolean,
      default: false,
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

// ======================== Hooks ========================
docHooks.reEncryptPassword(userSchema);
docHooks.updatePasswordChangedAt(userSchema);

// ======================== Instance Method ========================
userSchema.methods.correctPassword = async function (
  candidatePassword,
  actualPassword
) {
  return await bcrypt.compare(candidatePassword, actualPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins later

  return resetToken;
};

userSchema.methods.isPasswordChanged = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimeStamp > JWTTimestamp;
  }

  return false;
};

// Virtual Props
userSchema.virtual("age").get(function () {
  if (this.birthday !== undefined) {
    return Math.floor(
      (Date.now() - this.birthday) / (60 * 60 * 24 * 365 * 1000)
    );
  }
});


const User = mongoose.model("User", userSchema);

module.exports = User;
