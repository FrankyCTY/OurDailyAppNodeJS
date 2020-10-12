const { format, transports, createLogger } = require("winston");
require("winston-mongodb");
const { DB } = require("../config/database");

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  defaultMeta: { service: "user-service" },
  transports: [
    new transports.File({ filename: "./logs/info.log", level: "info" }),
    // new transports.MongoDB({
    //   level: "error",
    //   db: DB,
    //   options: { useUnifiedTopology: true },
    //   collection: "errorLog",
    // }),
  ],
});

// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new transports.Console({ 
//       format: format.simple(),
//     })
//   );
// }

module.exports = logger;
