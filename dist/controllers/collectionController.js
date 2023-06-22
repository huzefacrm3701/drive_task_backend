"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCollections = exports.createCollection = void 0;
const folderModel_1 = require("../models/folderModel");
const collectionModel_1 = require("../models/collectionModel");
const admin = require("firebase-admin");
const moment = require("moment");
const getUserName = (user_id) => {
    switch (user_id) {
        case "6414105397247f2e3d953a29":
            return "Huzefa Multanpurawala";
        case "64902a27fa4da28560dafcb4":
            return "Test File User";
        case "643a38458f0d5e4227629a0e":
            return "Neil Jhaveri";
    }
};
const createCollection = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { collectionType, collectionName, collectionDetails, collectionNotes, chosenFolderId, seperateFolder, fileSizeLimit, linkExpirationLimit, notifyUser, } = req.body;
        const newCollection = new collectionModel_1.collectionModelSchema({
            user_id,
            business_id,
            company_id,
            collectionType,
            collectionName,
            collectionDetails,
            collectionNotes,
            seperateFolder,
            linkExpirationLimit,
            notifyUser,
        });
        if (chosenFolderId === "") {
            const rootFolder = await folderModel_1.folderModelSchema.findOne({
                user_id,
                business_id,
                company_id,
                is_delete: false,
                folderName: "My Folder",
                parentFolderId: "/",
            });
            if (!rootFolder) {
                throw new Error(`Could not find root folder`);
            }
            const newParentFoldersList = [
                ...rootFolder.parentFoldersList,
                {
                    folderId: rootFolder._id,
                    parentFolderName: rootFolder.folderName,
                },
            ];
            const newFolder = await folderModel_1.folderModelSchema.create({
                user_id,
                business_id: business_id,
                company_id: company_id,
                folderName: collectionName.trim(),
                parentFolderId: rootFolder._id,
                parentFoldersList: newParentFoldersList,
                files: [],
                created_by: user_id,
                modified_by: "",
                date_created: moment(),
                date_modified: moment(),
                is_delete: false,
            });
            newCollection.chosenFolderId = newFolder._id;
        }
        else {
            newCollection.chosenFolderId = chosenFolderId;
        }
        const calcualtedSizeLimit = Number(fileSizeLimit.split(" ")[0]) *
            (fileSizeLimit.split(" ")[1] === "MB" ? 1024 : 1024 * 1024);
        newCollection.fileSizeLimit = calcualtedSizeLimit;
        newCollection.created_by = getUserName(user_id);
        newCollection.date_created = moment();
        newCollection.date_modified = moment();
        newCollection.modified_by = getUserName(user_id);
        await newCollection.save();
        return res.status(200).json({
            status: "success",
            data: newCollection,
        });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.createCollection = createCollection;
const getAllCollections = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const allCollections = await collectionModel_1.collectionModelSchema.aggregate([
            {
                $match: {
                    user_id,
                    business_id,
                    company_id,
                    is_delete: false,
                },
            },
            // {
            //   $lookup: {
            //     from: "files",
            //     foreignField: "_id",
            //     localField: "files.file",
            //     as: "files"
            //   }
            // },
            {
                $project: {
                    is_delete: 0,
                    __v: 0,
                },
            },
        ]);
        return res.status(200).json({ data: allCollections });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.getAllCollections = getAllCollections;
