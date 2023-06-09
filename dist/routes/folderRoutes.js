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
const folderController = __importStar(require("../controllers/folderController"));
const folderRouter = express_1.default.Router();
// Add files and folders route
folderRouter.post("/addNewFolder", folderController.addNewFolder);
// Get files and folders route
folderRouter.get("/getRootFolder", folderController.getRootFolder);
folderRouter.get("/getFolderById/:id", folderController.getFolderById);
folderRouter.get("/getAllFilesAndFolders", folderController.getAllFoldersAndFiles);
// Search files and folders route
folderRouter.get("/searchFilesAndFoldersByName", folderController.searchFilesAndFoldersByName);
// Rename folders route
folderRouter.patch("/renameFolderById/:id", folderController.renameFolderById);
// Delete folders route
folderRouter.delete("/deleteFoldersByIds", folderController.deleteFoldersByIds);
// Trash and Restore route
folderRouter.get("/getTrash", folderController.getTrash);
folderRouter.patch("/restoreFilesAndFolders", folderController.restoreFilesAndFolders);
// Permanentally delete files and folders route
folderRouter.delete("/permanentDeleteFilesAndFolders", folderController.permanentDeleteFilesAndFolders);
exports.default = folderRouter;
