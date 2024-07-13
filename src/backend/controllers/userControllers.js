const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendForgotPasswordEmail = require("../utils/sendEmail.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiResponse = require("../utils/ApiResponse.js");
const User = require("../models/userModels.js");

const genrateAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.genrateAccessToken();

        user.accessToken = accessToken;

        await user.save({ validateBeforeSave: false });
        return accessToken;

    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Something went wrong during create token!"));
    }
}

const genrateOtp = async (length) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).json(new ApiResponse(400, "Invalid Credential!"));
    }

    // here isPasswordCorrect is a model function so call by the user Reference
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        return res.status(400).json(new ApiResponse(400, "Invalid Credential!"));
    };

    const accessToken = await genrateAccessToken(user.id);

    const logedInUser = await User.findById(user._id).select("-password -accessToken -forgotOtpHash");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).json(new ApiResponse(200, "Login Succcessfully.", { user: logedInUser, accessToken }));
});


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            accessToken: 1
        }
    },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).json(new ApiResponse(200, "Logout SuccessFully"));
});

const signupUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const existedUser = await User.findOne({ username });

    if (existedUser) {
        return res.status(400).json(new ApiResponse(200, "User allready Exist"));
    }

    const createdUser = await User.create({
        username,
        email,
        password
    });

    const user = await User.findOne(createdUser._id).select("-password -accessToken");

    if (!user) {
        return res.status(400).json(new ApiResponse(400, "Error Occured During Register!"));
    }

    return res.status(200).json(new ApiResponse(200, "successfully register User", user));
});

const forgotEmailSend = asyncHandler(async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json(new ApiResponse(400, "Username Required!"));
    }

    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).json(new ApiResponse(400, "Invalid Username!"));
    }

    const otp = await genrateOtp(6);

    sendForgotPasswordEmail(user.email, user.username, otp);

    const salt = await bcrypt.genSalt(10);
    const otphash = await bcrypt.hash(otp.toString(), salt);

    const payload = {
        id: user._id,
    }

    const tempToken = jwt.sign(payload, "sdkfjasdkjfsifuoewfosadhfksdjfdjfdskjfue0iweu09230", {
        expiresIn: "10m"
    });

    user.forgotOtpHash = otphash;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, "Otp Sent On Your Email.", tempToken));

});

const validateOtp = asyncHandler(async (req, res) => {
    const { otp, token } = req.body;

    const decoredeToken = jwt.verify(token, "sdkfjasdkjfsifuoewfosadhfksdjfdjfdskjfue0iweu09230");

    const user = await User.findById(decoredeToken.id);

    const compairOtp = await bcrypt.compare(otp, user.forgotOtpHash);

    if (!compairOtp) {
        return res.status(400).json(new ApiResponse(400, "Incorrect Opt!"));
    }

    user.otpValidation = "success";
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, "success"));
});


const forgotPassword = asyncHandler(async (req, res) => {
    const { newpassword, token } = req.body;

    if (!token) {
        return res.status(400).json(new ApiResponse(400, "Unautherized Access!"));
    }

    const decoredeToken = jwt.verify(token, "sdkfjasdkjfsifuoewfosadhfksdjfdjfdskjfue0iweu09230")

    const user = await User.findById(decoredeToken.id);

    if (!user) {
        return res.status(400).json(new ApiResponse(400, "UnAutherized Access!"))
    }

    if (!user.otpValidation) {
        return res.status(400).json(new ApiResponse(400, "UnAutherized Access!"))
    }

    user.password = newpassword;

    await User.findByIdAndUpdate(decoredeToken.id, {
        $unset: {
            forgotOtpHash: 1,
            otpValidation: 1
        }
    },
        {
            new: true
        }
    );    

    await user.save();

    return res.status(200).json(new ApiResponse(200, "Successfully Changed Password"));

});

module.exports = {
    loginUser,
    logoutUser,
    signupUser,
    forgotEmailSend,
    validateOtp,
    forgotPassword,
}