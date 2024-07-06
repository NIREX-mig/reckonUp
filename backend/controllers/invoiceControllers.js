const ApiResponse = require("../utils/asyncHandler.js");
const Invoice = require("../models/InvoiceModels.js");
const asyncHandler = require("../utils/asyncHandler.js");

const createInvoice = asyncHandler(async (req, res) => {
    const {
        customerName,
        customerPhone,
        customerAddress,
        invoiceNo,
        productList,
        grossAmt,
        makingCost,
        GST,
        gstAmt,
        sgst,
        cgst,
        netAmt,
        exchangeAmt,
        exchangeCategory,
        exchangePercentage,
        exchangeWeight,
    } = req.body;

    const invoiceObj = {
        customerName,
        customerPhone,
        customerAddress,
        invoiceNo,
        productList,
        grossAmt,
        makingCost,
        netAmt,
        GST,
        gstAmt,
        sgst,
        cgst,
        exchangeAmt,
        exchangeCategory,
        exchangePercentage,
        exchangeWeight
    }

    const createdInvoice = await Invoice.create(invoiceObj);

    const invoice = await Invoice.findById(createdInvoice._id);

    if (!invoice) {
        return res.status(400).json(new ApiResponse(400, "Error Occured During Invoice Save!"));
    }

    return res.status(200).json(new ApiResponse(200, "Invoice Saved SuccessFully."));
});

const fetchByInvoiceNo = asyncHandler(async (req, res) => {
    const { invoiceNo } = req.body;

    const singleInvoice = await Invoice.aggregate([
        {
            $match: {
                invoiceNo: invoiceNo,
            }
        }
    ]);

    if (!singleInvoice || singleInvoice.length === 0) {
        return res.status(401).json(new ApiResponse(401, "Invalid Invoice Number!"));
    };

    return res.status(200).json(new ApiResponse(200, "success", singleInvoice));
});

const fetchByCustomerName = asyncHandler(async (req, res) => {
    const { customerName } = req.body;

    const invoices = await Invoice.aggregate([
        {
            $match: {
                customerName: customerName,
            }
        }
    ]);

    if (!invoices || invoices.length === 0) {
        return res.status(400).json(new ApiResponse(400, "Invalid Customer Name!"));
    }

    return res.status(200).json(new ApiResponse(200, "success", invoices))
});

const fetchByDateRange = asyncHandler(async (req, res) => {

    const { startingDate, endingDate } = req.body;

    const start = new Date(startingDate);
    const end = new Date(endingDate);

    const invoices = await Invoice.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: start,
                    $lte: end
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, "success", invoices));
});

const fetchTodayInvoice = asyncHandler(async (req, res) => {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const invoices = await Invoice.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, "success", invoices))
})


const totalCountOfInvoice = asyncHandler(async (req, res) => {
    const count = await Invoice.countDocuments();
    return res.status(200).json(new ApiResponse(200, "success", count));
})

const tracks = asyncHandler(async (req, res) => {
    const today = new Date();

    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayTracks = await Invoice.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            }
        },
        {
            $group: {
                _id: null,
                totalTodayAmt: { $sum: "$netAmt" },
                totalTodayInvoice: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0
            }
        }

    ]);

    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const lastMonthTrack = await Invoice.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: startOfCurrentMonth
                }
            }
        },
        {
            $group: {
                _id: null,
                totalLastMonthAmt: { $sum: "$netAmt" },
                totalLastMonthInvoice: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    ])

    const tracksData = {
        totalTodayAmt: todayTracks[0]?.totalTodayAmt,
        totalTodayInvoice: todayTracks[0]?.totalTodayInvoice,
        totalLastMonthAmt: lastMonthTrack[0]?.totalLastMonthAmt,
        totalLastMonthInvoice: lastMonthTrack[0]?.totalLastMonthInvoice
    }

    return res.status(200).json(new ApiResponse(200, "success", tracksData));
});


module.exports = {
    createInvoice,
    fetchByCustomerName,
    fetchByDateRange,
    fetchByInvoiceNo,
    totalCountOfInvoice,
    tracks,
    fetchTodayInvoice
}