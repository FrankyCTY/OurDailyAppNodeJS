class OperationalErr extends Error {
  constructor(message, statusCode, scope) {
    super();
    // Tranforming string error message into Array, to unite the format of error message
    // Easier for front end to handle the errors.
    this.message = typeof message === "string" ? [message] : message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    /*
     * scope {String} ["local" | "global"]
     */
    this.scope = scope || "global";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = OperationalErr;
