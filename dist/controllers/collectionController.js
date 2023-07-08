"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFilesForCollection = exports.deleteAllCollections = exports.checkCollectionValidity = exports.deleteCollection = exports.toggleCollectionStatus = exports.getAllCollections = exports.createCollection = void 0;
const folderModel_1 = require("../models/folderModel");
const collectionModel_1 = require("../models/collectionModel");
const fileController_1 = require("./fileController");
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
        const { collectionType, collectionName, collectionDetails, collectionNotes, chosenFolderId, seperateFolder, fileSizeLimit, linkExpirationLimit, notifyUser, usersSubmitted, } = req.body.collection;
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
            usersSubmitted,
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
            (fileSizeLimit.split(" ")[1] === "MB"
                ? Math.pow(1024, 2)
                : Math.pow(1024, 3));
        newCollection.fileSizeLimit = calcualtedSizeLimit;
        newCollection.created_by = getUserName(user_id);
        newCollection.date_created = moment();
        newCollection.date_modified = moment();
        newCollection.modified_by = getUserName(user_id);
        newCollection.collectionLink = `${req.body.path}/${newCollection._id}`;
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
        const { filter } = req.params;
        const allCollections = await collectionModel_1.collectionModelSchema.aggregate([
            {
                $match: {
                    user_id,
                    business_id,
                    company_id,
                    is_delete: false,
                    collectionStatus: filter,
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
const toggleCollectionStatus = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { id } = req.params;
        const collection = await collectionModel_1.collectionModelSchema.findById({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: id,
        });
        collection.collectionStatus =
            collection.collectionStatus === "ACTIVE" ? "COMPLETED" : "ACTIVE";
        collection.date_modified = moment();
        const updatedCollection = await collection.save();
        return res.status(200).json({ status: "success", data: updatedCollection });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.toggleCollectionStatus = toggleCollectionStatus;
const deleteCollection = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { id } = req.params;
        const collection = await collectionModel_1.collectionModelSchema.findOneAndUpdate({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            collectionStatus: "COMPLETED",
            _id: id,
        }, {
            is_delete: true,
            date_modified: moment(),
        }, { new: true });
        return res.status(200).json({ status: "success", data: collection });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.deleteCollection = deleteCollection;
const checkCollectionValidity = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { id } = req.params;
        const collection = await collectionModel_1.collectionModelSchema.findOne({
            _id: id,
            collectionStatus: "ACTIVE",
            is_delete: false,
        }, "-__v -is_delete");
        if (!collection) {
            throw new Error("Collection Link Expired or Collection Doesn't Exists");
        }
        const collectionExpiration = new Date(collection.linkExpirationLimit).getTime() > new Date().getTime();
        if (!collectionExpiration) {
            throw new Error("Collection Link Expired or Collection Doesn't Exists");
        }
        return res.status(200).json({ status: "success", data: collection });
    }
    catch (error) {
        return res.status(404).json({
            status: "failure",
            message: error.message,
        });
    }
};
exports.checkCollectionValidity = checkCollectionValidity;
const deleteAllCollections = async (req, res) => {
    try {
        const deleteCollection = await collectionModel_1.collectionModelSchema.deleteMany({});
        return res.status(200).json({ status: "success" });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.deleteAllCollections = deleteAllCollections;
const submitFilesForCollection = async (req, res) => {
    try {
        const { user_id, business_id, company_id, collection_user_id, collection_business_id, collection_company_id, } = req.headers;
        const { id } = req.params;
        let folder, targetFolderId;
        const filesId = [];
        const collection = await collectionModel_1.collectionModelSchema.findOne({
            user_id: collection_user_id,
            business_id: collection_business_id,
            company_id: collection_company_id,
            _id: id,
            collectionStatus: "ACTIVE",
            is_delete: false,
        });
        if (!collection)
            return res.status(404).json({
                status: "error",
                message: "Collection does not exist!!",
            });
        const chosenFolder = await folderModel_1.folderModelSchema.findOne({
            user_id: collection_user_id,
            business_id: collection_business_id,
            company_id: collection_company_id,
            _id: collection.chosenFolderId,
            is_delete: false,
        });
        if (!chosenFolder) {
            return res.status(404).json({
                status: "error",
                message: "Chosen Folder doesn't exist!!",
            });
        }
        const userExists = collection.usersSubmitted.find((user) => user.userId === user_id);
        if (collection.seperateFolder) {
            if (userExists) {
                // User Exists
                targetFolderId = userExists.folderId;
                folder = await folderModel_1.folderModelSchema.findOne({
                    user_id: collection_user_id,
                    business_id: collection_business_id,
                    company_id: collection_company_id,
                    _id: targetFolderId,
                    is_delete: false,
                });
            }
            else {
                // User Does Not Exists
                folder = new folderModel_1.folderModelSchema({
                    user_id: collection_user_id,
                    business_id: collection_business_id,
                    company_id: collection_company_id,
                    folderName: getUserName(user_id),
                    parentFolderId: chosenFolder._id,
                    parentFoldersList: [
                        ...chosenFolder.parentFoldersList,
                        {
                            folderId: chosenFolder._id,
                            parentFolderName: chosenFolder.folderName,
                        },
                    ],
                    files: [],
                    created_by: user_id,
                    modified_by: "",
                    date_created: moment(),
                    date_modified: moment(),
                    is_delete: false,
                });
                targetFolderId = folder._id;
                collection.usersSubmitted.push({
                    userId: user_id,
                    folderId: targetFolderId,
                    files: [],
                    lastSubmission: moment(),
                });
            }
        }
        else {
            targetFolderId = chosenFolder._id;
            folder = await folderModel_1.folderModelSchema.findOne({
                user_id: collection_user_id,
                business_id: collection_business_id,
                company_id: collection_company_id,
                _id: targetFolderId,
                is_delete: false,
            });
            !userExists &&
                collection.usersSubmitted.push({
                    userId: user_id,
                    folderId: targetFolderId,
                    files: [],
                    lastSubmission: moment(),
                });
        }
        const files = await (0, fileController_1.storeFiles)(collection_user_id, collection_business_id, collection_company_id, req.files, targetFolderId);
        filesId.push(...files.map((file) => file._id));
        folder.files.push(...filesId);
        const userIndex = collection.usersSubmitted.findIndex((user) => user.userId === user_id);
        collection.usersSubmitted[userIndex].files = [
            ...collection.usersSubmitted[userIndex].files,
            ...filesId.map((id) => ({ file: id, dateSubmitted: moment() })),
        ];
        collection.date_modified = moment();
        collection.modified_by = getUserName(user_id);
        await folder.save();
        await collection.save();
        return res.status(200).json({
            status: "success",
            data: collection,
            message: "Files Submitted Successfully!!",
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An error occurred while submitting files.",
        });
    }
};
exports.submitFilesForCollection = submitFilesForCollection;
