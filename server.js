process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! Shutting down...");
    console.log(err);
  
    process.exit(1);
  });

// eslint-disable-next-line import/newline-after-import
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const mongoose = require("mongoose");
const app = require("./app");

// 1) MongoDB set up
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });

// 2) Start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
