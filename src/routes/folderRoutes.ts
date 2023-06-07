import express from "express";
import * as folderController from "../controllers/folderController";
import * as folderMiddlewares from "../middlewares/folderMiddlewares";

const multer = require("multer");
const folderRouter = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Add files and folders route
folderRouter.post("/addNewFolder", folderController.addNewFolder);
folderRouter.post(
  "/addFilesToFolder/:id",
  upload.array("files"),
  folderController.addFilesToFolder
);
folderRouter.post(
  "/addGoogleDriveFilesToFolder/:folderId",
  folderMiddlewares.getMimeType,
  folderController.addGoogleDriveFilesToFolder
);
folderRouter.post(
  "/addOneDriveFilesToFolder/:folderId",
  folderController.addOneDriveFilesToFolder
);
folderRouter.post(
  "/addDropboxFilesToFolder/:folderId",
  folderController.addDropboxFilesToFolder
);

// Get files and folders route
folderRouter.get("/getRootFolder", folderController.getRootFolder);
folderRouter.get("/getFolderById/:id", folderController.getFolderById);
folderRouter.get(
  "/getAllFilesAndFolders",
  folderController.getAllFoldersAndFiles
);

// Search files and folders route
folderRouter.get(
  "/searchFilesAndFoldersByName",
  folderController.searchFilesAndFoldersByName
);

// Update files and folders route
folderRouter.patch("/renameFileById/:id", folderController.renameFileById);
folderRouter.patch("/renameFolderById/:id", folderController.renameFolderById);

// Delete files and folders route
folderRouter.delete("/deleteFoldersByIds", folderController.deleteFoldersByIds);
folderRouter.delete(
  "/removeFilesFromFolder/:id",
  folderController.removeFilesFromFolder
);

// Move files to another folder route
folderRouter.patch(
  "/moveFileToAnotherFolder",
  folderController.moveFileToAnotherFolder
);

// Trash and Restore route
folderRouter.get("/getTrash", folderController.getTrash);
folderRouter.patch(
  "/restoreFilesAndFolders",
  folderController.restoreFilesAndFolders
);

// Permanentally delete files and folders route
folderRouter.delete(
  "/permanentDeleteFilesAndFolders",
  folderController.permanentDeleteFilesAndFolders
);

export default folderRouter;
