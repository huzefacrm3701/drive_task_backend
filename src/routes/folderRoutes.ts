import express from "express";
import * as folderController from "../controllers/folderController";

const folderRouter = express.Router();

// Add files and folders route
folderRouter.post("/addNewFolder", folderController.addNewFolder);

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

// Rename folders route
folderRouter.patch("/renameFolderById/:id", folderController.renameFolderById);

// Delete folders route
folderRouter.delete("/deleteFoldersByIds", folderController.deleteFoldersByIds);

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