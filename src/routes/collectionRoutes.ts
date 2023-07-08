import express from "express";
import * as collectionController from "../controllers/collectionController";
import * as fileController from "../controllers/fileController";

const collectionRouter = express.Router();

const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// Create Collection route
collectionRouter.post(
  "/createCollection",
  collectionController.createCollection
);

//Get All Collections
collectionRouter.get(
  "/getAllCollections/:filter",
  collectionController.getAllCollections
);

//Disable Collection
collectionRouter.delete(
  "/toggleCollectionStatusById/:id",
  collectionController.toggleCollectionStatus
);

//Delete Collection
collectionRouter.delete(
  "/deleteCollectionById/:id",
  collectionController.deleteCollection
);

//Check CollectionValidity
collectionRouter.get(
  "/checkCollectionValidity/:id",
  collectionController.checkCollectionValidity
);

collectionRouter.delete(
  "/deleteAllCollections",
  collectionController.deleteAllCollections
);

collectionRouter.post(
  "/submitFilesForCollection/:id",
  upload.array("files"),
  collectionController.submitFilesForCollection,
);

export default collectionRouter;
