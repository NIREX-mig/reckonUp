const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const InvoiceModel = new mongoose.Schema({
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Setting"
    },

    customerName : {
        type : String,
        required : true,
    },

    customerPhone : {
        type : Number,
    },

    customerAddress : {
        type : String,
        required : true, 
    },

    invoiceNo : {
        type : String,
        required : true,
    },

    productList : [
        {
            type : Object,
            required : true
        }
    ],

    grossAmt : {
        type : String,
        required : true,
    },
    
    makingCost : {
        type : Number,
    },

    netAmt : {
        type : Number,
        required : true,
    },

    GST : {
        type : Boolean
    },

    gstAmt : {
        type : Number
    },

    cgst : {
        type : Number
    },

    sgst : {
        type : Number
    },

    exchangeAmt : {
        type : Number
    },

    exchangeCategory : {
        type : String,
    },

    exchangePercentage : {
        type : Number,
    },

    exchangeWeight : {
        type : Number,
    }

}, {timestamps : true});

InvoiceModel.plugin(aggregatePaginate);

const Invoice = mongoose.model("Invoice", InvoiceModel);

module.exports = Invoice;