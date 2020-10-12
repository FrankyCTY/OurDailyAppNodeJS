// const update = require("immutability-helper");
const OperationalErr = require("../helpers/OperationalErr");

const sendErrorDev = (error, req, res) => {
  res.status(error.statusCode).json({
    status: error.status,
    error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrorProd = (error, req, res) => {
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }
  // Programming and other errors
  // 1) log error
  console.error("ERROR: ", error);

  // 2) send response
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

const handleObjectIdErrorDB = (error) => {
  return new OperationalErr(`Invalid ${error.path}: ${error.value}.`, 400);
};

const handleDuplicateFieldDB = (error) => {
  const fieldValue = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

  return new OperationalErr(
    `Duplicate field value: ${fieldValue}. Please use another value!`,
    400
  );
};

const handleValidationErrDB = (error) => {
  const allErrMsgs = Object.values(error.errors).map(
    (errObj) => errObj.message
  );

  const message = `Invalid input data. ${allErrMsgs.join(". ")}`;

  return new OperationalErr(message, 400);
};

const handleJWTErr = () =>
  new OperationalErr("Invalid token. Please log in again!", 401);

const handleJTWExpiredErr = () =>
  new OperationalErr("Your token has expired, please log in again!", 401);

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let err = { ...error };

    // handling error from mongodb or jsonwebtoken etc.
    // since it's different on how to identify their errors.  
    if (error.kind === "ObjectId") err = handleObjectIdErrorDB(error);
    if (error.code === 11000) err = handleDuplicateFieldDB(error);
    if (error._message === "Validation failed")
      err = handleValidationErrDB(error);
    if (error.name === "JsonWebTokenError") err = handleJWTErr();
    if (error.name === "TokenExpiredError") err = handleJTWExpiredErr();
    sendErrorProd(err, req, res);
  }
};
