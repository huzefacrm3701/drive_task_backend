"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionModelSchema = void 0;
const mongoose = require("mongoose");
const collectionModel = new mongoose.Schema({
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
    collectionType: {
        type: String,
        enum: ["INTERNAL", "EXTERNAL"],
        default: "INTERNAL",
        required: true,
    },
    collectionName: {
        type: String,
        required: true,
    },
    collectionDetails: {
        type: String,
        required: false,
    },
    collectionNotes: {
        type: String,
        required: false,
    },
    collectionLink: {
        type: String,
    },
    collectionStatus: {
        type: String,
        enum: ["ACTIVE", "COMPLETED"],
        default: "ACTIVE",
    },
    chosenFolderId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Folder",
    },
    usersSubmitted: [
        {
            userId: {
                type: String,
            },
            folderId: {
                type: mongoose.Types.ObjectId,
            },
            files: [
                {
                    file: {
                        type: mongoose.Types.ObjectId,
                        ref: "File",
                    },
                    dateSubmitted: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
            lastSubmission: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    seperateFolder: {
        type: Boolean,
        default: false,
    },
    fileSizeLimit: {
        type: Number,
        enum: [
            1 * Math.pow(1024, 2),
            10 * Math.pow(1024, 2),
            100 * Math.pow(1024, 2),
            1 * Math.pow(1024, 3),
            5 * Math.pow(1024, 3),
            10 * Math.pow(1024, 3),
            25 * Math.pow(1024, 3),
        ],
        default: 100 * 1024 * 1024,
    },
    linkExpirationLimit: {
        type: Date,
        required: true,
        default: function () {
            return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        },
    },
    notifyUser: {
        type: Boolean,
        required: false,
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
exports.collectionModelSchema = mongoose.model("Collection", collectionModel);
