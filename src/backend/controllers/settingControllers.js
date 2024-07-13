const fs = require("fs");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiResponse = require("../utils/ApiResponse.js");
const Setting = require("../models/settingModels.js");

const createSetting = asyncHandler(async (req, res) => {
    const { ownerName, mobileNumber, whatsappNumber, address, GSTNO } = req.body;

    const existedSetting = await Setting.findOne({ ownerName });

    if (existedSetting) {
        existedSetting.ownerName = ownerName;
        existedSetting.mobileNumber = mobileNumber;
        existedSetting.whatsappNumber = whatsappNumber;
        existedSetting.address = address;
        existedSetting.GSTNO = GSTNO;

        await existedSetting.save()

        return res.status(201).json(new ApiResponse(201, "Updated Successfully", existedSetting));
    }

    const settingData = {
        ownerName: ownerName,
        mobileNumber: mobileNumber,
        whatsappNumber: whatsappNumber,
        address: address,
        GSTNO : GSTNO
    }

    const setting = await Setting.create(settingData);

    const settingInstance = await Setting.findById(setting._id)

    if (!settingInstance) {
        return res.status(400).json(new ApiResponse(200, "Error Occured During Save!"));
    }

    return res.status(200).json(new ApiResponse(200, "success", setting));
});

const fetchSetting = asyncHandler(async (req, res) => {
    const setting = await Setting.find().select("-_id -createdAt -updatedAt -__v");
    return res.status(200).json(new ApiResponse(200, "Success", setting[0]));
});

const fetchInvoiceLogo = asyncHandler(async (req, res) =>{
    const setting = await Setting.find().select("-createdAt -updatedAt");
    const filePath = setting[0].invoiceLogo;

    if(!filePath){
        return res.status(200);
    }

    const image = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'image/jpeg'); 

    return res.status(200).send(image);
});

const invoiceLogoUpdate = asyncHandler(async (req, res) => {

    const setting = await Setting.find();

    if (setting.length === 0) {
        return res.status(400).json(new ApiResponse(400, "something went wrong!"));
    }

    if (!setting[0]?.invoiceLogo) {
        setting[0].invoiceLogo = req.file?.path;
        await setting[0].save();
        return res.status(200).json(new ApiResponse(200, "successfully logo update."));
    }

    if(fs.existsSync(setting[0].invoiceLogo)){
        if(req.file?.path !== setting[0].invoiceLogo){
            fs.unlinkSync(setting[0]?.invoiceLogo);
        }
    }

    setting[0].invoiceLogo = req.file?.path;
    await setting[0].save();
    return res.status(200).json(new ApiResponse(200, "successfully logo update."));
});


module.exports = {
    createSetting,
    fetchSetting,
    invoiceLogoUpdate,
    fetchInvoiceLogo
}