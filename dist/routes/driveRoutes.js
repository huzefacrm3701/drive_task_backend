"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const folderRoutes_1 = __importDefault(require("./folderRoutes"));
const fileRoutes_1 = __importDefault(require("./fileRoutes"));
const collectionRoutes_1 = __importDefault(require("./collectionRoutes"));
const cloudPickerRoutes_1 = __importDefault(require("./cloudPickerRoutes"));
const driveRouter = express_1.default.Router();
driveRouter.use("/folders", folderRoutes_1.default);
driveRouter.use("/files", fileRoutes_1.default);
driveRouter.use("/collections", collectionRoutes_1.default);
driveRouter.use("/cloudPicker", cloudPickerRoutes_1.default);
exports.default = driveRouter;
