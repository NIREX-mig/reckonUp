const mongoose = require("mongoose");

const SettingModel = new mongoose.Schema({
    invoiceLogo : {
        type : String,
    },

    ownerName : {
        type : String,
        index : true
    },

    mobileNumber : {
        type : String,
    },

    whatsappNumber : {
        type : String,
    },

    GSTNO : {
        type : String,
    },
    address : {
        type : String,
    }

}, {timestamps : true});

const Setting = mongoose.model("Setting", SettingModel);

module.exports = Setting;