import express from "express";
import * as fileController from "../controllers/fileController";
import * as middlewares from "../middlewares/middlewares";

const fileRouter = express.Router();

const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

fileRouter.post(
  "/addFilesToFolder/:id",
  upload.array("files"),
  fileController.addFilesToFolder
);
fileRouter.post(
  "/addGoogleDriveFilesToFolder/:folderId",
  middlewares.getMimeType,
  fileController.addGoogleDriveFilesToFolder
);
fileRouter.post(
  "/addOneDriveFilesToFolder/:folderId",
  fileController.addOneDriveFilesToFolder
);
fileRouter.post(
  "/addDropboxFilesToFolder/:folderId",
  fileController.addDropboxFilesToFolder
);

// Rename files route
fileRouter.patch("/renameFileById/:id", fileController.renameFileById);

// Delete files route
fileRouter.delete(
  "/removeFilesFromFolder/:id",
  fileController.removeFilesFromFolder
);

// Move files to another folder route
fileRouter.patch(
  "/moveFileToAnotherFolder",
  fileController.moveFileToAnotherFolder
);

fileRouter.post(
  "/addFilesToFolder/:id",
  upload.array("files"),
  fileController.addFilesToFolder
);
fileRouter.post(
  "/addGoogleDriveFilesToFolder/:folderId",
  middlewares.getMimeType,
  fileController.addGoogleDriveFilesToFolder
);
fileRouter.post(
  "/addOneDriveFilesToFolder/:folderId",
  fileController.addOneDriveFilesToFolder
);
fileRouter.post(
  "/addDropboxFilesToFolder/:folderId",
  fileController.addDropboxFilesToFolder
);

// Rename files route
fileRouter.patch("/renameFileById/:id", fileController.renameFileById);

// Delete files route
fileRouter.delete(
  "/removeFilesFromFolder/:id",
  fileController.removeFilesFromFolder
);

// Move files to another folder route
fileRouter.patch(
  "/moveFileToAnotherFolder",
  fileController.moveFileToAnotherFolder
);

fileRouter.delete("/deleteFiles", fileController.deleteFiles);

export default fileRouter;
