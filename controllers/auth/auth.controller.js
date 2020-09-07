const withCatchErrAsync = require("../../utils/error/withCatchErrorAsync");
const OperationalErr = require("../../utils/error/OperationalErr");
const User = require("../../models/user/user.model");
const authUtils = require("./auth.utils");

// @desc    Aloow users to sign up
// @awaiting modi   User can not input {role, passwordChangedAt}
// @public
exports.signUp = withCatchErrAsync(async (req, res, next) => {
    const {name, email, password, passwordConfirm, gender, birthday} = req.body;

    const newUser = await User.create({
        name,
        email,
        password,
        passwordConfirm,
        gender,
        birthday,
    });

    return authUtils.createSendToken(newUser, 201, res);
});