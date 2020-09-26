const bcrypt = require("bcryptjs");

// @desc    Re-encrypting the password everytime the password changes
//          only save the encrypted password into database
exports.reEncryptPassword = (userSchema) => {
  userSchema.pre("save", async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified("password")) {
      return next();
    }

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
  });
};

// @desc          Excluding creation of doc, "passwordChangedAt" needs to be changed
//                everytime the password is changed
// @restriction   passwordChangedAt < tokenIAT
exports.updatePasswordChangedAt = (userSchema) => {
  userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) {
      return next();
    }

    // -1s to ensure the passwordChangedAt < tokenIAT
    this.passwordChangedAt = Date.now() - 1000;
    return next();
  });
};
