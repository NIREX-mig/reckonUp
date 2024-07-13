const ApiResponse = require("../utils/ApiResponse.js");
const User = require("../models/userModels.js");
const asyncHandler = require("../utils/asyncHandler.js");
const jwt = require("jsonwebtoken");

const verifyJwt = asyncHandler(async (req, res, next) =>{
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if(!token) {
        return res.status(400).json(new ApiResponse(400, "Unatherized Request!"));
    }

    const decordedToken = jwt.verify(token,"sdkfjasdkjfsifuoewfosadhfksdjfdjfdskjfue0iweu09230[ejr[023-we[09-32");

    const user = await User.findById(decordedToken.id).select("-password -accessToken");

    if(!user) {
        return res.status(400).json(new ApiResponse(400, "Invalid AccessToken!"));
    }

    req.user = user;
    next();
})

module.exports = verifyJwt;