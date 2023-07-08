import express from "express";
import * as cloudPickerController from "../controllers/cloudPickerController";

const cloudPickerRouter = express.Router();

cloudPickerRouter.post(
  "/createCloudPickerUser",
  cloudPickerController.createCloudPickerUser
);

cloudPickerRouter.post(
  "/storeAccessToken",
  cloudPickerController.storeAccessToken
);

cloudPickerRouter.get("/getAccessToken", cloudPickerController.getAccessToken);

export default cloudPickerRouter;
