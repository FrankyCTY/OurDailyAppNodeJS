process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err);

  process.exit(1);
});

// eslint-disable-next-line import/newline-after-import
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const app = require("./app");
const connectToMongoDB = require("./config/database");

// Connecting to the database
connectToMongoDB();

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
