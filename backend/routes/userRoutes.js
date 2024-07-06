const verifyJwt = require("../middlewares/authMiddlewares.js");
const express = require("express");
const {loginValidator,singupValidator} = require("../validators/authvalidators.js");
const validate = require("../validators/validate.js");
const { forgotEmailSend, forgotPassword, loginUser, logoutUser, signupUser, validateOtp } = require("../controllers/userControllers.js");

const router = express.Router();

router.route("/login").post(
    loginValidator(),
    validate,
    loginUser
);
router.route("/signup").post(
    singupValidator(),
    validate,
    signupUser
);

router.route('/forgotemail').post(
    forgotEmailSend
);

router.route("/validateotp").post(
    validateOtp
);

router.route("/forgotpassword").patch(
    forgotPassword
)

router.route("/logout").get(
    verifyJwt,
    logoutUser
);

module.exports = router;