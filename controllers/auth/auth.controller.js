// const { s3 } = require("../../config/AWS");
const {getFromS3} = require("../../utils/s3Utils");
const withCatchErrAsync = require("../../utils/error/withCatchErrorAsync");
const User = require("../../models/user/user.model");
const authUtils = require("./auth.utils");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const OperationalErr = require("../../helpers/OperationalErr");
const { sendEmail } = require("../../utils/mailer");
const { promisify } = require("util");

const client = new OAuth2Client(
  "805613129868-l5s4bkonv7tdfec7f5nqa1l6rp8rtdin.apps.googleusercontent.com"
);

exports.protect = withCatchErrAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists
  let token;
  const { authorization } = req.headers;


  if (authorization && authorization.startsWith("Bearer")) {
    token = authorizations.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token === null || token === undefined) {
    
    return next(
      new OperationalErr(
        "You are not logged in! Please log in to get access.",
        401,
        "global"
      )
    );
  }

  // 2) Verify the token
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3) Check if user still exists @error [can check if user still active]
  const currentUser = await User.findById(decodedPayload.id);
  console.log(decodedPayload.id)

  if (currentUser === null) {
    return next(
      new OperationalErr(
        "You are not logged in! Please log in to get access.",
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.isPasswordChanged(decodedPayload.iat)) {
    return next(
      new OperationalErr(
        "User recently changed password! Please log in again.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  console.log("I am in the protect middleware");
  req.user = currentUser;
  next();
});

//@desc Allow users to log in
//@public
exports.logIn = withCatchErrAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) DATABASE - check if the user email is in the database
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new OperationalErr(
        "form{SEPERATE}Incorrect email or password",
        401,
        "local"
      )
    );
  }

  // 2) If everything goes fine, send token to client
  return authUtils.createSendToken(user, 200, res);
});

// @desc    Allow users to sign up
// @public
exports.signUp = withCatchErrAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, gender, birthday } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    gender,
    birthday,
  });

  // Get the default jpeg from s3 and send it back to user for react state
  try {
    await getFromS3("default.jpeg", 
    (imgBuffer) => authUtils.createSendToken(newUser, 201, res, imgBuffer));
  } catch (error) {
    console.log(error);
    return next(new OperationalErr("Error getting image from aws", 500, "local"));
  }
      
});

exports.logOut = withCatchErrAsync(async (req, res, next) => {
  res.clearCookie("jwt");

  return res.status(200).json({
    status: "success"
  })
})

exports.googleLogIn = withCatchErrAsync(async (req, res, next) => {
  const { tokenId } = req.body;

  const { payload } = await client.verifyIdToken({
    idToken: tokenId,
    audience: process.env.REACT_APP_GOOGLE_CLIENTID,
  });

  const { email_verified, email, name, } = payload;
  if (email_verified) {
    const userDoc = await User.findOne({ email });

    if (userDoc) {
      // set isOauthAccount to true
      userDoc.isOauthAccount = true;

      authUtils.createSendToken(userDoc, 201, res);
    } else {

      // else User email not created in database
      const password = email + process.env.RANDOM_HASH;

      const newUser = await User.create({
        name,
        email,
        password,
        // set isOauthAccount to true
        isOauthAccount: true
      });

      authUtils.createSendToken(newUser, 201, res);
    }
  }
});

exports.forgotPassword = withCatchErrAsync(async (req, res, next) => {
  // 1) check if user exists based on POSTED email
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new OperationalErr("No User with this email address found.", 404, "local")
    );
  }

  // 2) Generate the random reset token
  // Also added the passwordResetToken and passwordResetExpires into the doc.
  const resetToken = user.createPasswordResetToken();
  await user.save();

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL} \nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 mins)",
      message,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    return next(
      new OperationalErr(
        "There was an error sending the reset password email. Try again later!",
        500,
        "local"
      )
    );
  }

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});

exports.resetPassword = withCatchErrAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is a user, set the new password
  // No user, throw error
  if (user === null) {
    return next(
      new OperationalErr(
        "Your token is invalid or has expired, please try again.",
        400,
        "local"
      )
    );
  }

  const { password, passwordConfirm } = req.body;
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update JWT and changedPasswordAt property for the user
  // 4) Log the user in , send JWT to the client
  return authUtils.createSendToken(user, 200, res);
});
