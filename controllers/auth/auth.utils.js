const jwt = require("jsonwebtoken");

const signToken = (id) => {
    return jwt.sign(
        {
            id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN,
        }
    );
};

exports.createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRIES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };

    // Token will only be sent via HTTPS
    if(process.env.NODE_ENV === "production") cookieOptions.secure = true;

    // Send cookie -> server to client
    res.cookie("jwt", token, cookieOptions);

    // Get rid of sensitive data
    user.password = undefined;
    user.passwordChangedAt = undefined;

    return res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        }
    });
};