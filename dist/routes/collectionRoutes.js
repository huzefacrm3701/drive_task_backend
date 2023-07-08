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
const collectionController = __importStar(require("../controllers/collectionController"));
const collectionRouter = express_1.default.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
// Create Collection route
collectionRouter.post("/createCollection", collectionController.createCollection);
//Get All Collections
collectionRouter.get("/getAllCollections/:filter", collectionController.getAllCollections);
//Disable Collection
collectionRouter.delete("/toggleCollectionStatusById/:id", collectionController.toggleCollectionStatus);
//Delete Collection
collectionRouter.delete("/deleteCollectionById/:id", collectionController.deleteCollection);
//Check CollectionValidity
collectionRouter.get("/checkCollectionValidity/:id", collectionController.checkCollectionValidity);
collectionRouter.delete("/deleteAllCollections", collectionController.deleteAllCollections);
collectionRouter.post("/submitFilesForCollection/:id", upload.array("files"), collectionController.submitFilesForCollection);
exports.default = collectionRouter;
