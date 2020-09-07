const {validationResult} = require("express-validator");
const OperationalErr = require("../utils/error/OperationalErr");

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const msg = errors.array().map(errObj => errObj.msg);
        return next(new OperationalErr(msg, 403));
    }
    return next();
}

module.exports = validate;