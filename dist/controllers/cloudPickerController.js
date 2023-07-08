"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleAuthURL = exports.getAccessToken = exports.storeAccessToken = exports.createCloudPickerUser = void 0;
const cloudPickerModel_1 = require("../models/cloudPickerModel");
const moment = require("moment");
const createCloudPickerUser = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.body;
        const cloudPickerUser = new cloudPickerModel_1.cloudPickerModelSchema({
            user_id,
            business_id,
            company_id,
            created_by: user_id,
            modified_by: "",
            date_created: moment(),
            date_modified: moment(),
            is_delete: false,
        });
        await cloudPickerUser.save();
        res.status(200).json({ status: "success", data: cloudPickerUser });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.createCloudPickerUser = createCloudPickerUser;
const storeAccessToken = async (req, res) => {
    try {
        const { user_id, business_id, company_id, picker, access_token: accessToken, } = req.headers;
        const cloudPickerUser = await cloudPickerModel_1.cloudPickerModelSchema.findOneAndUpdate({
            user_id,
            business_id,
            company_id,
            is_delete: false,
        }, {
            [`${picker}PickerAccessToken`]: accessToken,
            date_modified: moment(),
        });
        res.status(200).json({ status: "success", data: cloudPickerUser });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.storeAccessToken = storeAccessToken;
const getAccessToken = async (req, res) => {
    try {
        const { user_id, business_id, company_id, picker } = req.headers;
        const cloudPickerUser = await cloudPickerModel_1.cloudPickerModelSchema.findOne({
            user_id,
            business_id,
            company_id,
            is_delete: false,
        });
        if (!cloudPickerUser)
            throw new Error("Cloud picker user not found");
        console.log(cloudPickerUser[`${picker}PickerAccessToken`]);
        res.status(200).json({
            status: "success",
            data: { accessToken: cloudPickerUser[`${picker}PickerAccessToken`] },
        });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.getAccessToken = getAccessToken;
const getGoogleAuthURL = (req, res) => {
    const { user_id, business_id, company_id } = req.headers;
};
exports.getGoogleAuthURL = getGoogleAuthURL;
