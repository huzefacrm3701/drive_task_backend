"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fileController = __importStar(require("../controllers/fileController"));
const middlewares = __importStar(require("../middlewares/middlewares"));
const fileRouter = express_1.default.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
fileRouter.post("/addFilesToFolder/:id", upload.array("files"), fileController.addFilesToFolder);
fileRouter.post("/addGoogleDriveFilesToFolder/:folderId", middlewares.getMimeType, fileController.addGoogleDriveFilesToFolder);
fileRouter.post("/addOneDriveFilesToFolder/:folderId", fileController.addOneDriveFilesToFolder);
fileRouter.post("/addDropboxFilesToFolder/:folderId", fileController.addDropboxFilesToFolder);
// Rename files route
fileRouter.patch("/renameFileById/:id", fileController.renameFileById);
// Delete files route
fileRouter.delete("/removeFilesFromFolder/:id", fileController.removeFilesFromFolder);
// Move files to another folder route
fileRouter.patch("/moveFileToAnotherFolder", fileController.moveFileToAnotherFolder);
fileRouter.post("/addFilesToFolder/:id", upload.array("files"), fileController.addFilesToFolder);
fileRouter.post("/addGoogleDriveFilesToFolder/:folderId", middlewares.getMimeType, fileController.addGoogleDriveFilesToFolder);
fileRouter.post("/addOneDriveFilesToFolder/:folderId", fileController.addOneDriveFilesToFolder);
fileRouter.post("/addDropboxFilesToFolder/:folderId", fileController.addDropboxFilesToFolder);
// Rename files route
fileRouter.patch("/renameFileById/:id", fileController.renameFileById);
// Delete files route
fileRouter.delete("/removeFilesFromFolder/:id", fileController.removeFilesFromFolder);
// Move files to another folder route
fileRouter.patch("/moveFileToAnotherFolder", fileController.moveFileToAnotherFolder);
fileRouter.delete("/deleteFiles", fileController.deleteFiles);
exports.default = fileRouter;
