const ApiResponse = require("../utils/ApiResponse.js");
const { validationResult } = require("express-validator")

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    res.status(400).json(new ApiResponse(400, "validation Error! ", { Error: errors.array() }));
}

module.exports = validate;