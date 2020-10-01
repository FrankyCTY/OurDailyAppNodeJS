const mongoose = require("mongoose");

exports.DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

exports.connectToMongoDB = (DB) => {
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
};
