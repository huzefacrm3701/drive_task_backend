"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFiles = exports.removeFilesFromFolder = exports.moveFileToAnotherFolder = exports.renameFileById = exports.addDropboxFilesToFolder = exports.addOneDriveFilesToFolder = exports.addGoogleDriveFilesToFolder = exports.addFilesToFolder = exports.storeFiles = void 0;
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const moment_1 = __importDefault(require("moment"));
const fileModel_1 = require("../models/fileModel");
const folderModel_1 = require("../models/folderModel");
const utils_1 = require("../utils/utils");
const axios_1 = __importDefault(require("axios"));
const dotenv = require("dotenv");
const { parsed } = dotenv.config();
const storeFiles = async (user_id, business_id, company_id, files, folderId) => {
    let filesArray = [];
    let file;
    for (file of files) {
        const accessToken = uuidv4();
        const fileName = `${accessToken}-${file.originalname}`;
        const downloadUrl = await (0, utils_1.uploadToFirestore)(file.mimetype, file.buffer, fileName, accessToken);
        if (downloadUrl) {
            const newFile = await fileModel_1.fileModelSchema.create({
                user_id,
                business_id,
                company_id,
                folderId: folderId,
                fileType: file.mimetype,
                fileName: file.originalname,
                uploadedFileName: fileName,
                url: downloadUrl,
                created_by: user_id,
                modified_by: "",
                date_created: (0, moment_1.default)(),
                date_modified: (0, moment_1.default)(),
            });
            filesArray.push(newFile);
        }
    }
    return filesArray;
};
exports.storeFiles = storeFiles;
const addFilesToFolder = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const folder = await folderModel_1.folderModelSchema.findOne({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: req.params.id,
        });
        if (!folder) {
            throw new Error("Folder Does Not Exist");
        }
        const files = await (0, exports.storeFiles)(user_id, business_id, company_id, req.files, folder._id);
        folder.files.push(...files.map((file) => file._id));
        await folder.save();
        res.status(200).json({ data: files });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.addFilesToFolder = addFilesToFolder;
const addGoogleDriveFilesToFolder = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const files = req.body;
        const { folderId } = req.params;
        let folder = await folderModel_1.folderModelSchema.findOne({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: folderId,
        });
        if (!folder) {
            throw new Error("Folder Does Not Exist");
        }
        let filesArray = [];
        const keyFile = parsed.keyFile;
        const auth = new GoogleAuth({
            keyFile,
            scopes: "https://www.googleapis.com/auth/drive",
        });
        const client = await auth.getClient();
        const service = google.drive({ version: "v3", auth: client });
        for (const file of files) {
            const accessToken = uuidv4();
            const fileName = `${accessToken}-${file.name}`;
            let fileResponse;
            if (file.temp === "OTHER FILE") {
                fileResponse = await service.files.get({
                    fileId: file.id,
                    alt: "media",
                }, { responseType: "arraybuffer" });
            }
            else {
                fileResponse = await service.files.export({
                    fileId: file.id,
                    mimeType: file.mimeType,
                }, { responseType: "arraybuffer" });
            }
            const arraybuffer = fileResponse.data;
            const downloadUrl = await (0, utils_1.uploadToFirestore)(file.mimeType, arraybuffer, fileName, accessToken);
            if (downloadUrl) {
                const newFile = await fileModel_1.fileModelSchema.create({
                    user_id,
                    business_id: business_id,
                    company_id: company_id,
                    folderId: folder._id,
                    fileType: file.mimeType,
                    fileName: file.temp === "GOOGLE FILE"
                        ? `${file.name}${file.extension}`
                        : file.name,
                    uploadedFileName: fileName,
                    url: downloadUrl,
                    created_by: user_id,
                    modified_by: "",
                    date_created: (0, moment_1.default)(),
                    date_modified: (0, moment_1.default)(),
                });
                filesArray.push(newFile);
                folder.files.push(newFile._id);
            }
        }
        await folder.save();
        res.status(200).json({ data: filesArray });
    }
    catch (error) {
        let errorMessage, statusCode;
        switch (error.code.toString()) {
            case "404":
                statusCode = 403;
                errorMessage = "Private or Restricted file can not be uploaded";
                break;
            case "429":
                statusCode = 429;
                errorMessage = "Too Many Requests... Try again after some time";
                break;
            default:
                statusCode = 500;
                errorMessage = "Something went wrong";
        }
        return res.status(statusCode).json({
            status: "Failed",
            message: errorMessage,
        });
    }
};
exports.addGoogleDriveFilesToFolder = addGoogleDriveFilesToFolder;
const addOneDriveFilesToFolder = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const files = req.body;
        const { folderId } = req.params;
        let folder = await folderModel_1.folderModelSchema.findOne({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: folderId,
        });
        if (!folder) {
            throw new Error("Folder Does Not Exist");
        }
        let filesArray = [];
        for (const file of files) {
            const accessToken = uuidv4();
            const fileUrl = file.fileUrl;
            const response = await axios_1.default.get(fileUrl, {
                responseType: "arraybuffer",
            });
            const mimeType = response.headers["content-type"];
            const arrayBuffer = response.data;
            const fileName = `${accessToken}-${file.name}`;
            const downloadUrl = await (0, utils_1.uploadToFirestore)(mimeType, arrayBuffer, fileName, accessToken);
            if (downloadUrl) {
                const newFile = await fileModel_1.fileModelSchema.create({
                    user_id,
                    business_id,
                    company_id,
                    folderId: folder._id,
                    fileType: mimeType,
                    fileName: file.name,
                    uploadedFileName: fileName,
                    url: downloadUrl,
                    created_by: user_id,
                    modified_by: "",
                    date_created: (0, moment_1.default)(),
                    date_modified: (0, moment_1.default)(),
                });
                filesArray.push(newFile);
                folder.files.push(newFile._id);
            }
        }
        await folder.save();
        res.status(200).json({ data: filesArray });
    }
    catch (error) {
        let errorMessage, statusCode;
        switch (error.code.toString()) {
            case "404":
                statusCode = 403;
                errorMessage = "Private or Restricted file can not be uploaded";
                break;
            case "429":
                statusCode = 429;
                errorMessage = "Too Many Requests... Try again after some time";
                break;
            default:
                statusCode = 500;
                errorMessage = "Something went wrong";
        }
        return res.status(statusCode).json({
            status: "Failed",
            message: errorMessage,
        });
    }
};
exports.addOneDriveFilesToFolder = addOneDriveFilesToFolder;
const addDropboxFilesToFolder = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const files = req.body;
        const { folderId } = req.params;
        let folder = await folderModel_1.folderModelSchema.findOne({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: folderId,
        });
        if (!folder) {
            throw new Error("Folder Does Not Exist");
        }
        let filesArray = [];
        for (const file of files) {
            const accessToken = uuidv4();
            const fileUrl = file.fileUrl;
            const response = await axios_1.default.get(fileUrl, {
                responseType: "arraybuffer",
            });
            const mimeType = response.headers["content-type"];
            const arrayBuffer = response.data;
            const fileName = `${accessToken}-${file.name}`;
            const downloadUrl = await (0, utils_1.uploadToFirestore)(mimeType, arrayBuffer, fileName, accessToken);
            if (downloadUrl) {
                const newFile = await fileModel_1.fileModelSchema.create({
                    user_id,
                    business_id,
                    company_id,
                    folderId: folder._id,
                    fileType: mimeType,
                    fileName: file.name,
                    uploadedFileName: fileName,
                    url: downloadUrl,
                    created_by: user_id,
                    modified_by: "",
                    date_created: (0, moment_1.default)(),
                    date_modified: (0, moment_1.default)(),
                });
                filesArray.push(newFile);
                folder.files.push(newFile._id);
            }
        }
        await folder.save();
        res.status(200).json({ data: filesArray });
    }
    catch (error) {
        let errorMessage, statusCode;
        switch (error.code.toString()) {
            case "404":
                statusCode = 403;
                errorMessage = "Private or Restricted file can not be uploaded";
                break;
            case "429":
                statusCode = 429;
                errorMessage = "Too Many Requests... Try again after some time";
                break;
            default:
                statusCode = 500;
                errorMessage = "Something went wrong";
        }
        return res.status(statusCode).json({
            status: "Failed",
            message: errorMessage,
        });
    }
};
exports.addDropboxFilesToFolder = addDropboxFilesToFolder;
const renameFileById = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { id } = req.params;
        const { newFileName } = req.body;
        const file = await fileModel_1.fileModelSchema.findOneAndUpdate({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: id,
        }, {
            fileName: newFileName.trim(),
            date_modified: (0, moment_1.default)(),
        }, { new: true });
        if (file === null) {
            throw new Error(`File not found`);
        }
        return res
            .status(200)
            .json({ status: "success", message: "File successfully updated" });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.renameFileById = renameFileById;
const moveFileToAnotherFolder = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { fileIds, currentFolderId, moveFolderId } = req.body;
        await fileModel_1.fileModelSchema.updateMany({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: fileIds,
        }, {
            folderId: moveFolderId,
            date_modified: (0, moment_1.default)(),
        });
        await folderModel_1.folderModelSchema.findOneAndUpdate({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: currentFolderId,
        }, {
            $pull: {
                files: { $in: fileIds },
            },
            $set: {
                date_modified: (0, moment_1.default)(),
            },
        }, { new: true });
        await folderModel_1.folderModelSchema.findOneAndUpdate({
            user_id,
            business_id,
            company_id,
            is_delete: false,
            _id: moveFolderId,
        }, {
            $push: {
                files: fileIds,
            },
            $set: {
                date_modified: (0, moment_1.default)(),
            },
        }, { new: true });
        return res
            .status(200)
            .json({ status: "success", message: "File successfully moved" });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.moveFileToAnotherFolder = moveFileToAnotherFolder;
const removeFilesFromFolder = async (req, res) => {
    try {
        const { user_id, business_id, company_id } = req.headers;
        const { id } = req.params;
        const { fileIds } = req.body;
        const folder = await folderModel_1.folderModelSchema.findById(id);
        if (folder === null) {
            throw new Error("Folder or File does not exist");
        }
        const result = await fileModel_1.fileModelSchema.updateMany({
            user_id,
            business_id,
            company_id,
            folderId: id,
            _id: fileIds,
        }, {
            is_delete: true,
            date_modified: (0, moment_1.default)(),
        }, { new: true });
        return res.status(200).json({ status: "success", data: result });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.removeFilesFromFolder = removeFilesFromFolder;
const deleteFiles = async (req, res) => {
    try {
        const deleteFiles = await fileModel_1.fileModelSchema.deleteMany({});
        return res.status(200).json({ status: "success" });
    }
    catch (error) {
        const errorResponse = { error: error.message };
        return res.status(400).json(errorResponse);
    }
};
exports.deleteFiles = deleteFiles;
