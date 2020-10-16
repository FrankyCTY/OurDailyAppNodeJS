const jwt = require("jsonwebtoken");

const signToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN, // 90d
    }
  );
};

exports.createSendToken = (user, statusCode, res, avatarBuffer) => {
  console.log("createSendToken activated")
  const token = signToken(user._id);
  const cookieOptions = {
    // 90
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRIES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      overwrite: true,
      // sameSite: 'strict', // THIS is the config you are looing for.
    };
    
    // Token will only be sent via HTTPS
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    
    // Send cookie -> server to client
    res.cookie("jwt", token, cookieOptions);
    
  // Get rid of sensitive data
  user.password = undefined;
  user.passwordChangedAt = undefined;

  // if user provides the avatarBuffer than we will use it for the
  // front end avatar state
  if (avatarBuffer) {
    return res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user,
        image: avatarBuffer
      },
    });
  }
  else {
    return res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user,
      },
    });
  }
};
