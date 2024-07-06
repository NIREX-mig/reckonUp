const verifyJwt = require("../middlewares/authMiddlewares.js");
const express = require("express");
const { createInvoice, fetchByCustomerName, fetchByDateRange, fetchByInvoiceNo, fetchTodayInvoice, totalCountOfInvoice, tracks } = require("../controllers/invoiceControllers.js");

const router = express.Router();

router.route("/").post(
    verifyJwt,
    createInvoice
);

router.route("/invoiceNo").post(
    verifyJwt,
    fetchByInvoiceNo
);

router.route("/customerName").post(
    verifyJwt,
    fetchByCustomerName
);

router.route("/bydate").post(
    verifyJwt,
    fetchByDateRange
);

router.route("/count").get(
    verifyJwt,
    totalCountOfInvoice
);

router.route("/tracks").get(
    verifyJwt,
    tracks
);

router.route("/todayInvoices").get(
    verifyJwt,
    fetchTodayInvoice
);


module.exports = router;