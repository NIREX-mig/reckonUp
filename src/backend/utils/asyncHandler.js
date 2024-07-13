const ApiResponse = require("./ApiResponse.js")

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err)=>{
            res.status(500).json(new ApiResponse(500,err.message))
            next(err)
        });
    }
}

module.exports = asyncHandler;