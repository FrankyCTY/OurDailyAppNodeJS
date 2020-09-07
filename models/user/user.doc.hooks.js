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