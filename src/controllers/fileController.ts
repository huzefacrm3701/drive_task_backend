const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");

import { Request, Response } from "express";

const { v4: uuidv4 } = require("uuid");
import moment from "moment";
import { FileInterface, RequestFile } from "../interfaces/fileInterface";
import { FolderInterface } from "../interfaces/folderInterface";
import { fileModelSchema } from "../models/fileModel";
import { folderModelSchema } from "../models/folderModel";
import { uploadToFirestore } from "../utils/utils";
import axios from "axios";
import { ErrorResponse } from "../interfaces/errorInterface";
import mongoose from "mongoose";

const dotenv = require("dotenv");

const { parsed } = dotenv.config();

export const storeFiles = async (
  user_id: string,
  business_id: string,
  company_id: string,
  files,
  folderId: mongoose.Schema.Types.ObjectId
) => {
  let filesArray: Array<FileInterface> = [];
  let file: RequestFile;

  for (file of files) {
    const accessToken = uuidv4();
    const fileName = `${accessToken}-${file.originalname}`;
    const downloadUrl = await uploadToFirestore(
      file.mimetype,
      file.buffer,
      fileName,
      accessToken
    );

    if (downloadUrl) {
      const newFile: FileInterface = await fileModelSchema.create({
        user_id,
        business_id,
        company_id,
        folderId: folderId,
        fileType: file.mimetype,
        fileName: file.originalname,
        uploadedFileName: fileName,
        url: downloadUrl,
        created_by: user_id,
        modified_by: "",
        date_created: moment(),
        date_modified: moment(),
      });

      filesArray.push(newFile);
    }
  }
  return filesArray;
};

export const addFilesToFolder = async (req: any, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const folder: FolderInterface = await folderModelSchema.findOne({
      user_id,
      business_id,
      company_id,
      is_delete: false,
      _id: req.params.id,
    });

    if (!folder) {
      throw new Error("Folder Does Not Exist");
    }

    const files = await storeFiles(
      user_id,
      business_id,
      company_id,
      req.files,
      folder._id
    );
    folder.files.push(...files.map((file) => file._id));

    await folder.save();

    res.status(200).json({ data: files });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const addGoogleDriveFilesToFolder = async (req: any, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const files: {
      id: string;
      mimeType: string;
      name: string;
      temp: "GOOGLE FILE" | "OTHER FILE";
      extension: string;
    }[] = req.body;

    const { folderId } = req.params;

    let folder: FolderInterface = await folderModelSchema.findOne({
      user_id,
      business_id,
      company_id,
      is_delete: false,
      _id: folderId,
    });

    if (!folder) {
      throw new Error("Folder Does Not Exist");
    }

    let filesArray: Array<FileInterface> = [];

    const keyFile = parsed.keyFile;

    const auth = new GoogleAuth({
      keyFile,
      scopes: "https://www.googleapis.com/auth/drive",
    });

    const client = await auth.getClient();

    const service = google.drive({ version: "v3", auth: client });

    for (const file of files) {
      const accessToken = uuidv4();

      const fileName = `${accessToken}-${file.name}`;

      let fileResponse: any;

      if (file.temp === "OTHER FILE") {
        fileResponse = await service.files.get(
          {
            fileId: file.id,
            alt: "media",
          },
          { responseType: "arraybuffer" }
        );
      } else {
        fileResponse = await service.files.export(
          {
            fileId: file.id,
            mimeType: file.mimeType,
          },
          { responseType: "arraybuffer" }
        );
      }

      const arraybuffer = fileResponse.data;

      const downloadUrl = await uploadToFirestore(
        file.mimeType,
        arraybuffer,
        fileName,
        accessToken
      );

      if (downloadUrl) {
        const newFile = await fileModelSchema.create({
          user_id,
          business_id: business_id,
          company_id: company_id,
          folderId: folder._id,
          fileType: file.mimeType,
          fileName:
            file.temp === "GOOGLE FILE"
              ? `${file.name}${file.extension}`
              : file.name,
          uploadedFileName: fileName,
          url: downloadUrl,
          created_by: user_id,
          modified_by: "",
          date_created: moment(),
          date_modified: moment(),
        });

        filesArray.push(newFile);
        folder.files.push(newFile._id);
      }
    }

    await folder.save();

    res.status(200).json({ data: filesArray });
  } catch (error: unknown) {
    let errorMessage: string, statusCode: number;
    switch ((error as ErrorResponse).code.toString()) {
      case "404":
        statusCode = 403;
        errorMessage = "Private or Restricted file can not be uploaded";
        break;
      case "429":
        statusCode = 429;
        errorMessage = "Too Many Requests... Try again after some time";
        break;
      default:
        statusCode = 500;
        errorMessage = "Something went wrong";
    }
    return res.status(statusCode).json({
      status: "Failed",
      message: errorMessage,
    });
  }
};

export const addOneDriveFilesToFolder = async (req: any, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const files: {
      fileUrl: string;
      name: string;
    }[] = req.body;

    const { folderId } = req.params;

    let folder: FolderInterface = await folderModelSchema.findOne({
      user_id,
      business_id,
      company_id,
      is_delete: false,
      _id: folderId,
    });

    if (!folder) {
      throw new Error("Folder Does Not Exist");
    }

    let filesArray: Array<FileInterface> = [];

    for (const file of files) {
      const accessToken = uuidv4();
      const fileUrl = file.fileUrl;
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });

      const mimeType = response.headers["content-type"];
      const arrayBuffer = response.data;
      const fileName = `${accessToken}-${file.name}`;
      const downloadUrl = await uploadToFirestore(
        mimeType,
        arrayBuffer,
        fileName,
        accessToken
      );

      if (downloadUrl) {
        const newFile = await fileModelSchema.create({
          user_id,
          business_id,
          company_id,
          folderId: folder._id,
          fileType: mimeType,
          fileName: file.name,
          uploadedFileName: fileName,
          url: downloadUrl,
          created_by: user_id,
          modified_by: "",
          date_created: moment(),
          date_modified: moment(),
        });

        filesArray.push(newFile);
        folder.files.push(newFile._id);
      }
    }

    await folder.save();

    res.status(200).json({ data: filesArray });
  } catch (error: unknown) {
    let errorMessage: string, statusCode: number;
    switch ((error as ErrorResponse).code.toString()) {
      case "404":
        statusCode = 403;
        errorMessage = "Private or Restricted file can not be uploaded";
        break;
      case "429":
        statusCode = 429;
        errorMessage = "Too Many Requests... Try again after some time";
        break;
      default:
        statusCode = 500;
        errorMessage = "Something went wrong";
    }
    return res.status(statusCode).json({
      status: "Failed",
      message: errorMessage,
    });
  }
};

export const addDropboxFilesToFolder = async (req: any, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const files: {
      fileUrl: string;
      name: string;
    }[] = req.body;

    const { folderId } = req.params;

    let folder: FolderInterface = await folderModelSchema.findOne({
      user_id,
      business_id,
      company_id,
      is_delete: false,
      _id: folderId,
    });

    if (!folder) {
      throw new Error("Folder Does Not Exist");
    }

    let filesArray: Array<FileInterface> = [];

    for (const file of files) {
      const accessToken = uuidv4();
      const fileUrl = file.fileUrl;
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });

      const mimeType = response.headers["content-type"];
      const arrayBuffer = response.data;
      const fileName = `${accessToken}-${file.name}`;
      const downloadUrl = await uploadToFirestore(
        mimeType,
        arrayBuffer,
        fileName,
        accessToken
      );

      if (downloadUrl) {
        const newFile = await fileModelSchema.create({
          user_id,
          business_id,
          company_id,
          folderId: folder._id,
          fileType: mimeType,
          fileName: file.name,
          uploadedFileName: fileName,
          url: downloadUrl,
          created_by: user_id,
          modified_by: "",
          date_created: moment(),
          date_modified: moment(),
        });

        filesArray.push(newFile);
        folder.files.push(newFile._id);
      }
    }

    await folder.save();

    res.status(200).json({ data: filesArray });
  } catch (error: unknown) {
    let errorMessage: string, statusCode: number;
    switch ((error as ErrorResponse).code.toString()) {
      case "404":
        statusCode = 403;
        errorMessage = "Private or Restricted file can not be uploaded";
        break;
      case "429":
        statusCode = 429;
        errorMessage = "Too Many Requests... Try again after some time";
        break;
      default:
        statusCode = 500;
        errorMessage = "Something went wrong";
    }
    return res.status(statusCode).json({
      status: "Failed",
      message: errorMessage,
    });
  }
};

export const renameFileById = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const { id } = req.params;
    const { newFileName } = req.body;

    const file: FileInterface = await fileModelSchema.findOneAndUpdate(
      {
        user_id,
        business_id,
        company_id,
        is_delete: false,
        _id: id,
      },
      {
        fileName: newFileName.trim(),
        date_modified: moment(),
      },
      { new: true }
    );

    if (file === null) {
      throw new Error(`File not found`);
    }

    return res
      .status(200)
      .json({ status: "success", message: "File successfully updated" });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const moveFileToAnotherFolder = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const { fileIds, currentFolderId, moveFolderId } = req.body;

    await fileModelSchema.updateMany(
      {
        user_id,
        business_id,
        company_id,
        is_delete: false,
        _id: fileIds,
      },
      {
        folderId: moveFolderId,
        date_modified: moment(),
      }
    );

    await folderModelSchema.findOneAndUpdate(
      {
        user_id,
        business_id,
        company_id,
        is_delete: false,
        _id: currentFolderId,
      },
      {
        $pull: {
          files: { $in: fileIds },
        },
        $set: {
          date_modified: moment(),
        },
      },
      { new: true }
    );

    await folderModelSchema.findOneAndUpdate(
      {
        user_id,
        business_id,
        company_id,
        is_delete: false,
        _id: moveFolderId,
      },
      {
        $push: {
          files: fileIds,
        },
        $set: {
          date_modified: moment(),
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ status: "success", message: "File successfully moved" });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const removeFilesFromFolder = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const { id } = req.params;
    const { fileIds } = req.body;

    const folder: FolderInterface = await folderModelSchema.findById(id);

    if (folder === null) {
      throw new Error("Folder or File does not exist");
    }

    const result = await fileModelSchema.updateMany(
      {
        user_id,
        business_id,
        company_id,
        folderId: id,
        _id: fileIds,
      },
      {
        is_delete: true,
        date_modified: moment(),
      },
      { new: true }
    );

    return res.status(200).json({ status: "success", data: result });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const deleteFiles = async (req: Request, res: Response) => {
  try {
    const deleteFiles = await fileModelSchema.deleteMany({});
    return res.status(200).json({ status: "success" });
  } catch (error) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
}