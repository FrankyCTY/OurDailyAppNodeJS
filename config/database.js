const mongoose = require("mongoose");

module.exports = function connectToMongoDB() {
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
};
