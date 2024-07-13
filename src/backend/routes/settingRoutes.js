const verifyJwt = require("../middlewares/authMiddlewares.js");
const upload = require("../middlewares/multerMiddlewares.js");
const express = require("express");
const { createSetting, fetchInvoiceLogo, fetchSetting, invoiceLogoUpdate } = require("../controllers/settingControllers.js");

const router = express.Router();

router.route("/").post(
    verifyJwt,
    createSetting
);

router.route("/").get(
    verifyJwt,
    fetchSetting
);

router.route("/logoupdate").patch(
    verifyJwt,
    upload.single("invoiceLogo"),
    invoiceLogoUpdate
);

router.route("/getlogo").get(
    verifyJwt,
    fetchInvoiceLogo
);

module.exports = router;