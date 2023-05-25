"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileModelSchema = void 0;
const mongoose = require('mongoose');
const fileModel = new mongoose.Schema({
    user_id: {
        type: String,
        default: 'test123',
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
    folderId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    fileType: {
        type: String,
    },
    fileName: {
        type: String,
    },
    uploadedFileName: {
        type: String,
    },
    url: {
        type: String,
    },
    created_by: {
        type: String,
        required: false
    },
    modified_by: {
        type: String,
        required: false
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
exports.fileModelSchema = mongoose.model("File", fileModel);
