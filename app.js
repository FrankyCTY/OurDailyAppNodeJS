const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const userRouter = require("./routers/user.router");
const applicationRouter = require("./routers/application.router");
const globalErrorHandler = require("./controllers/globalErrController");
const OperationalErr = require("./helpers/OperationalErr");
const cors = require("cors");
// const { logger } = require("winston");

const app = express();

app.use(cors({credentials: true, origin: true}));

console.log(process.env.NODE_ENV);

// ======================== 1) Global Middlewares for every routers ========================

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "http://localhost:3000");
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

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
  max: 10000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

// Reading data from body into req.body
app.use(
  express.json({
    limit: "1000kb",
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

app.use((req, res, next) => {
  // logger.log("info", "hi");
  next();
});

// ======================== 2) Routes ========================

// API routes
app.use(`${process.env.URL}/users`, userRouter);

app.use(`${process.env.URL}/applications`, applicationRouter);

app.all("*", (req, res, next) => {
  return next(
    new OperationalErr(`Can't find ${req.originalUrl} on this server!`, 404)
  );
});

app.use(globalErrorHandler);

module.exports = app;
