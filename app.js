const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const userRouter = require("./routers/user.router");
const globalErrorHandler = require("./controllers/globalErrController");
const OperationalErr = require("./helpers/OperationalErr");
const cors = require("cors");
// const { v4: uuidv4 } = require("uuid");

const app = express();

// app.post("/api/v1/users/avatar", upload, (req, res) => {

//   console.log(req.file);

//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key,
//     Body: req.file.buffer,
//   };

//   s3.upload(params, (error, data) => {
//     if (error) {
//       res.status(500).send(error);
//     }
//     res.status(200).send({ message: "good to go", data });
//   });
// });

app.use(cors());

console.log(process.env.NODE_ENV);

// ======================== 1) Global Middlewares for every routers ========================
// Set Security HTTP headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      scriptSrc: ["'self'", "https://*.cloudflare. com"],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", "https:", "unsafe-inline"],
      upgradeInsecureRequests: [],
    },
  })
);

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit request from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

// Reading data from body into req.body
app.use(
  express.json({
    limit: "10kb",
  })
);
app.use(cookieParser());
app.use((req, res, next) => {
  // console.log(req.cookies);
  next();
});

// Data sanitization against NoSQL query injection
//Example: "email": {"$gt": ""}
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// ======================== 2) Routes ========================

// API routes
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
  return next(
    new OperationalErr(`Can't find ${req.originalUrl} on this server!`, 404)
  );
});

app.use(globalErrorHandler);

module.exports = app;
