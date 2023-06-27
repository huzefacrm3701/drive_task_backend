import express from "express";
import * as folderController from "../controllers/folderController";
import * as fileController from "../controllers/fileController";
import * as collectionController from "../controllers/collectionController";
import * as folderMiddlewares from "../middlewares/folderMiddlewares";

const multer = require("multer");
const folderRouter = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Add files and folders route
folderRouter.post("/addNewFolder", folderController.addNewFolder);
folderRouter.post(
  "/addFilesToFolder/:id",
  upload.array("files"),
  fileController.addFilesToFolder
);
folderRouter.post(
  "/addGoogleDriveFilesToFolder/:folderId",
  folderMiddlewares.getMimeType,
  fileController.addGoogleDriveFilesToFolder
);
folderRouter.post(
  "/addOneDriveFilesToFolder/:folderId",
  fileController.addOneDriveFilesToFolder
);
folderRouter.post(
  "/addDropboxFilesToFolder/:folderId",
  fileController.addDropboxFilesToFolder
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
folderRouter.patch("/renameFileById/:id", fileController.renameFileById);
folderRouter.patch("/renameFolderById/:id", folderController.renameFolderById);

// Delete files and folders route
folderRouter.delete("/deleteFoldersByIds", folderController.deleteFoldersByIds);
folderRouter.delete(
  "/removeFilesFromFolder/:id",
  fileController.removeFilesFromFolder
);

// Move files to another folder route
folderRouter.patch(
  "/moveFileToAnotherFolder",
  fileController.moveFileToAnotherFolder
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

// Create Collection route
folderRouter.post("/createCollection", collectionController.createCollection);

//Get All Collections
folderRouter.get(
  "/getAllCollections/:filter",
  collectionController.getAllCollections
);

//Disable Collection
folderRouter.delete(
  "/toggleCollectionStatusById/:id",
  collectionController.toggleCollectionStatus
);

//Delete Collection
folderRouter.delete(
  "/deleteCollectionById/:id",
  collectionController.deleteCollection
);

//Check CollectionValidity
folderRouter.get(
  "/checkCollectionValidity/:id",
  collectionController.checkCollectionValidity
);

folderRouter.delete(
  "/deleteAllCollections",
  collectionController.deleteAllCollections
);

export default folderRouter;
