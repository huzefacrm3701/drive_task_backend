"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudPickerModelSchema = void 0;
const mongoose = require("mongoose");
const cloudPickerModel = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
    business_id: {
        type: String,
        required: true,
    },
    company_id: {
        type: String,
        required: true,
    },
    googlePickerAccessToken: {
        type: String,
        default: "",
    },
    oneDrivePickerAccessToken: {
        type: String,
        default: "",
    },
    dropboxPickerAccessToken: {
        type: String,
        default: "",
    },
    created_by: {
        type: String,
        required: false,
    },
    modified_by: {
        type: String,
        required: false,
    },
    date_created: {
        type: Date,
    },
    date_modified: {
        type: Date,
    },
    is_delete: {
        type: Boolean,
        default: false,
    },
});
exports.cloudPickerModelSchema = mongoose.model("Cloud Picker", cloudPickerModel);
