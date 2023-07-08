import express from "express";
import folderRouter from "./folderRoutes";
import fileRouter from "./fileRoutes";
import collectionRouter from "./collectionRoutes";
import cloudPickerRouter from "./cloudPickerRoutes";

const driveRouter = express.Router();

driveRouter.use("/folders", folderRouter);
driveRouter.use("/files", fileRouter);
driveRouter.use("/collections", collectionRouter);
driveRouter.use("/cloudPicker", cloudPickerRouter);

export default driveRouter;
