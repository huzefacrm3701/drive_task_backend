"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFilesAndFoldersByName = exports.permanentDeleteFilesAndFolders = exports.restoreFilesAndFolders = exports.getTrash = exports.deleteFoldersByIds = exports.renameFolderById = exports.getFolderById = exports.getRootFolder = exports.getAllFoldersAndFiles = exports.addNewFolder = void 0;
const folderModel_1 = require("../models/folderModel");
const mongoose_1 = __importDefault(require("mongoose"));
const fileModel_1 = require("../models/fileModel");
const admin = require("firebase-admin");
const moment = require("moment");
const addNewFolder = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        let { folderName, parentFolderId } = req.body;
        let newParentFoldersList = [];
        if (!folderName && !parentFolderId) {
            folderName = "My Folder";
            parentFolderId = "/";
            newParentFoldersList.push({
                folderId: "/",
                parentFolderName: "/",
            });
        }
        else {
            const parentFolder = await folderModel_1.folderModelSchema.findOne({
                user_id,
                business_id,
                company_id,
                is_delete: false,
                _id: parentFolderId,
            });
            if (!parentFolder) {
                throw new Error(`Folder ${folderName} not Exist`);
            }
            newParentFoldersList = [
                ...parentFolder.parentFoldersList,
                {
                    folderId: parentFolderId,
                    parentFolderName: parentFolder.folderName,
                },
            ];
        }
        const newFolder = new folderModel_1.folderModelSchema({
            user_id,
            business_id: business_id,
            company_id: company_id,
            folderName: folderName.trim(),
            parentFolderId: parentFolderId,
            parentFoldersList: newParentFoldersList,
            files: [],
            created_by: user_id,
            modified_by: "",
            date_created: moment(),
            date_modified: moment(),
            is_delete: false,
        });
        await newFolder.save();
        return res.status(200).json({ data: newFolder });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.addNewFolder = addNewFolder;
const getAllFoldersAndFiles = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const allFolderAndFiles = await folderModel_1.folderModelSchema
            .find({
            user_id,
            business_id,
            company_id,
            is_delete: false,
        })
            .populate("files");
        return res.status(200).json({ data: allFolderAndFiles });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.getAllFoldersAndFiles = getAllFoldersAndFiles;
const getRootFolder = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
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
        const folder = await folderModel_1.folderModelSchema.aggregate([
            {
                $match: {
                    user_id,
                    business_id,
                    company_id,
                    is_delete: false,
                    _id: rootFolder._id,
                },
            },
            {
                $lookup: {
                    from: "files",
                    foreignField: "_id",
                    localField: "files",
                    as: "files",
                },
            },
            {
                $project: {
                    user_id: 1,
                    business_id: 1,
                    company_id: 1,
                    folderName: 1,
                    parentFolderId: 1,
                    parentFoldersList: 1,
                    created_by: 1,
                    modified_by: 1,
                    date_created: 1,
                    date_modified: 1,
                    files: {
                        $filter: {
                            input: "$files",
                            as: "f",
                            cond: {
                                $ne: ["$$f.is_delete", true],
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "folders",
                    pipeline: [
                        {
                            $match: {
                                parentFolderId: rootFolder._id.toString(),
                                is_delete: false,
                            },
                        },
                    ],
                    as: "folders",
                },
            },
            {
                $project: {
                    is_delete: 0,
                    __v: 0,
                    "parentFoldersList._id": 0,
                    "files.is_delete": 0,
                    "files.__v": 0,
                    "folders.files": 0,
                    "folders.__v": 0,
                    "folders.is_delete": 0,
                    "folders.parentFoldersList": 0,
                },
            },
        ]);
        if (folder.length === 0) {
            throw new Error("Folder does not exist");
        }
        return res.status(200).json({ data: folder });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.getRootFolder = getRootFolder;
const getFolderById = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { id } = req.params;
        let folder;
        folder = await folderModel_1.folderModelSchema.findOne({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: new mongoose_1.default.Types.ObjectId(id),
        });
        if (!folder) {
            throw new Error("Folder does not exist");
        }
        const parentFoldersList = folder.parentFoldersList.slice(1);
        for (let i = 0; i < parentFoldersList.length; i++) {
            folder = await folderModel_1.folderModelSchema.findOne({
                user_id,
                business_id,
                company_id,
                is_delete: false,
                _id: new mongoose_1.default.Types.ObjectId(parentFoldersList[i].folderId),
            });
            if (!folder) {
                throw new Error("Folder does not exist");
            }
        }
        folder = await folderModel_1.folderModelSchema.aggregate([
            {
                $match: {
                    user_id,
                    business_id,
                    company_id,
                    is_delete: false,
                    _id: new mongoose_1.default.Types.ObjectId(id),
                },
            },
            {
                $lookup: {
                    from: "files",
                    foreignField: "_id",
                    localField: "files",
                    as: "files",
                },
            },
            {
                $project: {
                    user_id: 1,
                    business_id: 1,
                    company_id: 1,
                    folderName: 1,
                    parentFolderId: 1,
                    parentFoldersList: 1,
                    created_by: 1,
                    modified_by: 1,
                    date_created: 1,
                    date_modified: 1,
                    files: {
                        $filter: {
                            input: "$files",
                            as: "f",
                            cond: {
                                $ne: ["$$f.is_delete", true],
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "folders",
                    pipeline: [
                        {
                            $match: {
                                parentFolderId: id,
                                is_delete: false,
                            },
                        },
                    ],
                    as: "folders",
                },
            },
            {
                $project: {
                    is_delete: 0,
                    __v: 0,
                    "parentFoldersList._id": 0,
                    "files.is_delete": 0,
                    "files.__v": 0,
                    "folders.files": 0,
                    "folders.__v": 0,
                    "folders.is_delete": 0,
                    "folders.parentFoldersList": 0,
                },
            },
        ]);
        return res.status(200).json({ data: folder });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.getFolderById = getFolderById;
const renameFolderById = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { id } = req.params;
        const { newFolderName } = req.body;
        //Updating the Folder Name
        const folder = await folderModel_1.folderModelSchema.findByIdAndUpdate({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: new mongoose_1.default.Types.ObjectId(id),
        }, {
            folderName: newFolderName.trim(),
            date_modified: moment(),
        }, { new: true });
        //Updating the Parent Folder's List
        await folderModel_1.folderModelSchema.updateMany({
            user_id,
            business_id,
            company_id,
            "parentFoldersList.folderId": id,
        }, {
            "parentFoldersList.$.parentFolderName": newFolderName.trim(),
            date_modified: moment(),
        });
        return res.status(200).json({ status: "success", data: folder });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.renameFolderById = renameFolderById;
const deleteFoldersByIds = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { folderIds } = req.body;
        const result = await folderModel_1.folderModelSchema.updateMany({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: folderIds,
        }, {
            is_delete: true,
            date_modified: moment(),
        }, { new: true });
        return res.status(200).json({ status: "success", data: result });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.deleteFoldersByIds = deleteFoldersByIds;
const getTrash = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const trashFiles = await fileModel_1.fileModelSchema.aggregate([
            {
                $match: {
                    user_id,
                    business_id,
                    company_id,
                    is_delete: true,
                },
            },
            {
                $addFields: {
                    type: "file",
                },
            },
            {
                $project: {
                    is_delete: 0,
                    __v: 0,
                    url: 0,
                },
            },
        ]);
        const trashFolders = await folderModel_1.folderModelSchema.aggregate([
            {
                $match: {
                    user_id,
                    business_id,
                    company_id,
                    is_delete: true,
                },
            },
            {
                $addFields: {
                    type: "folder",
                },
            },
            {
                $project: {
                    is_delete: 0,
                    __v: 0,
                    parentFoldersList: 0,
                    files: 0,
                },
            },
        ]);
        const trash = [
            ...trashFiles,
            ...trashFolders,
        ].sort((a, b) => new Date(b.date_modified).getTime() -
            new Date(a.date_modified).getTime());
        return res.status(200).json({ status: "success", data: trash });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.getTrash = getTrash;
const restoreFilesAndFolders = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { restores } = req.body;
        let filesToRootFolder = [];
        let folderIds = [];
        let filesToBeRestored = [];
        let foldersToBeRestored = [];
        for (let i = 0; i < restores.length; i++) {
            if (restores[i].type === "file") {
                const folder = await folderModel_1.folderModelSchema.findOne({
                    user_id,
                    business_id,
                    company_id,
                    _id: restores[i].folderId,
                    is_delete: false,
                });
                if (folder) {
                    filesToBeRestored.push(restores[i]._id);
                }
                else {
                    const remainingFilesAndFolders = restores.slice(i + 1);
                    if (!remainingFilesAndFolders.find((item) => item.type === "folder" && item._id === restores[i].folderId)) {
                        filesToRootFolder.push(restores[i]._id);
                        folderIds.push(restores[i].folderId);
                    }
                    else {
                        filesToBeRestored.push(restores[i]._id);
                    }
                }
            }
            else if (restores[i].type === "folder") {
                foldersToBeRestored.push(restores[i]._id);
            }
        }
        if (filesToBeRestored.length > 0) {
            await fileModel_1.fileModelSchema.updateMany({
                user_id,
                business_id,
                company_id,
                _id: filesToBeRestored,
            }, { is_delete: false, date_modified: moment() }, { new: true });
        }
        if (foldersToBeRestored.length > 0) {
            await folderModel_1.folderModelSchema.updateMany({
                user_id,
                business_id,
                company_id,
                _id: foldersToBeRestored,
            }, { is_delete: false, date_modified: moment() }, { new: true });
        }
        if (filesToRootFolder.length > 0) {
            let rootFolder = await folderModel_1.folderModelSchema.findOne({
                user_id,
                business_id,
                company_id,
                is_delete: false,
                folderName: "My Folder",
                parentFolderId: "/",
            });
            for (let i = 0; i < filesToRootFolder.length; i++) {
                await fileModel_1.fileModelSchema.findByIdAndUpdate({
                    user_id,
                    business_id,
                    company_id,
                    _id: filesToRootFolder[i],
                }, {
                    is_delete: false,
                    folderId: rootFolder._id,
                    date_modified: moment(),
                }, { new: true });
                await folderModel_1.folderModelSchema.findByIdAndUpdate({
                    user_id,
                    business_id,
                    company_id,
                    _id: folderIds[i],
                }, {
                    $pull: {
                        files: filesToRootFolder[i],
                    },
                    $set: {
                        date_modified: moment(),
                    },
                }, { new: true });
                rootFolder.files.push(filesToRootFolder[i]);
                rootFolder.date_modified = moment();
            }
            await rootFolder.save();
        }
        return res.status(200).json({
            status: "success",
            foldersToBeRestored,
            filesToBeRestored,
            filesToRootFolder,
            folderIds,
        });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.restoreFilesAndFolders = restoreFilesAndFolders;
const permanentDeleteFilesAndFolders = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { deletedItems } = req.body;
        const bucket = admin.storage().bucket();
        let foldersToBeDeleted = [];
        let filesToBeDeleted = [];
        let filesToBeDeletedFromFirebase = [];
        for (let i = 0; i < deletedItems.length; i++) {
            if (deletedItems[i].type === "folder") {
                const folderList = await folderModel_1.folderModelSchema.find({
                    user_id,
                    business_id,
                    company_id,
                    $or: [
                        { _id: deletedItems[i]._id },
                        { "parentFoldersList.folderId": deletedItems[i]._id },
                    ],
                }, "_id");
                foldersToBeDeleted = [
                    ...foldersToBeDeleted,
                    ...folderList.map((folder) => folder._id),
                ];
                const filesList = await fileModel_1.fileModelSchema.find({
                    user_id,
                    business_id,
                    company_id,
                    folderId: {
                        $in: foldersToBeDeleted,
                    },
                });
                filesToBeDeletedFromFirebase = [
                    ...filesToBeDeletedFromFirebase,
                    ...filesList.map((file) => file.uploadedFileName),
                ];
            }
            else if (deletedItems[i].type === "file") {
                filesToBeDeletedFromFirebase.push(deletedItems[i].uploadedFileName);
                filesToBeDeleted.push(deletedItems[i]._id);
            }
        }
        if (foldersToBeDeleted.length > 0) {
            await folderModel_1.folderModelSchema.deleteMany({
                user_id,
                business_id,
                company_id,
                _id: {
                    $in: foldersToBeDeleted,
                },
            });
            await fileModel_1.fileModelSchema.deleteMany({
                user_id,
                business_id,
                company_id,
                folderId: {
                    $in: foldersToBeDeleted,
                },
            });
        }
        if (filesToBeDeleted.length > 0) {
            await fileModel_1.fileModelSchema.deleteMany({
                user_id,
                business_id,
                company_id,
                _id: {
                    $in: filesToBeDeleted,
                },
            });
            await folderModel_1.folderModelSchema.updateMany({
                user_id,
                business_id,
                company_id,
                files: {
                    $in: filesToBeDeleted,
                },
            }, {
                $pull: {
                    files: {
                        $in: filesToBeDeleted,
                    },
                },
            });
        }
        for (let uploadFilename of filesToBeDeletedFromFirebase) {
            await bucket.file(uploadFilename).delete();
        }
        return res.status(200).json({
            status: "success",
            message: "Foldes And Files Successfully Deleted",
            foldersToBeDeleted,
            filesToBeDeleted,
            filesToBeDeletedFromFirebase,
        });
    }
    catch (error) {
        console.log(error);
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.permanentDeleteFilesAndFolders = permanentDeleteFilesAndFolders;
const searchFilesAndFoldersByName = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { searchValue } = req.body;
        const folders = await folderModel_1.folderModelSchema.find({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            folderName: {
                $regex: searchValue || "",
                $options: "i",
            },
        });
        const files = await fileModel_1.fileModelSchema.find({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            fileName: {
                $regex: searchValue || "",
                $options: "i",
            },
        });
        return res.status(200).json({ status: "success", folders, files });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.searchFilesAndFoldersByName = searchFilesAndFoldersByName;
