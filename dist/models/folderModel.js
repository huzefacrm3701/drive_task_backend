"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderModelSchema = void 0;
const mongoose = require("mongoose");
const FolderModel = new mongoose.Schema({
    user_id: {
        // type: mongoose.Types.ObjectId,
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
    folderName: {
        type: String,
        required: true,
    },
    parentFolderId: {
        type: String,
        required: true,
    },
    parentFoldersList: [
        {
            folderId: {
                type: String,
            },
            parentFolderName: {
                type: String,
            },
        },
    ],
    files: [
        {
            type: mongoose.Types.ObjectId,
            ref: "File",
        },
    ],
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
        required: false,
    },
    date_modified: {
        type: Date,
        required: false,
    },
    is_delete: {
        type: Boolean,
        required: true,
    },
});
exports.folderModelSchema = mongoose.model("Folder", FolderModel);
