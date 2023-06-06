import { Request, Response } from "express";
import { folderModelSchema } from "../models/folderModel";
import mongoose, { ObjectId } from "mongoose";
import { fileModelSchema } from "../models/fileModel";
import { Folder, ParentFoldersList } from "../interfaces/folderInterface";
import { ErrorResponse } from "../interfaces/errorInterface";
import { FileInterface } from "../interfaces/fileInterface";

const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");

const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const moment = require("moment");
import { uploadToFirestore } from "../utils/utils";
import jwtDecode from "jwt-decode";
import Axios, { AxiosResponse } from "axios";
import axios from "axios";

const dotenv = require("dotenv");

const { parsed } = dotenv.config();

const user_id = "test123";
const business_id = "test12345";
const company_id = "test@123";

const accessToken = uuidv4();

export const addNewFolder = async (req: Request, res: Response) => {
  try {
    let { folderName, parentFolderId } = req.body;
    let newParentFoldersList: Array<ParentFoldersList> = [];

    if (!folderName && !parentFolderId) {
      folderName = "My Folder";
      parentFolderId = "/";
      newParentFoldersList.push({
        folderId: "/",
        parentFolderName: "/",
      });
    } else {
      const parentFolder: Folder = await folderModelSchema.findOne({
        user_id: user_id,
        is_delete: false,
        _id: parentFolderId,
      });
      if (!parentFolder) {
        throw new Error(`Folder ${folderName} not Exist`);
      }

      newParentFoldersList = [
        ...parentFolder.parentFoldersList,
        {
          folderId: parentFolderId,
          parentFolderName: parentFolder.folderName,
        },
      ];
    }

    const newFolder: Folder = new folderModelSchema({
      user_id: user_id,
      business_id: business_id,
      company_id: company_id,
      folderName: folderName.trim(),
      parentFolderId: parentFolderId,
      parentFoldersList: newParentFoldersList,
      files: [],
      created_by: user_id,
      modified_by: "",
      date_created: moment(),
      date_modified: moment(),
      is_delete: false,
    });

    await newFolder.save();
    return res.status(200).json({ data: newFolder });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const getAllFoldersAndFiles = async (req: Request, res: Response) => {
  try {
    const allFolderAndFiles: Array<Folder> = await folderModelSchema
      .find({
        user_id: user_id,
        is_delete: false,
      })
      .populate("files");

    return res.status(200).json({ data: allFolderAndFiles });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const getRootFolder = async (req: Request, res: Response) => {
  try {
    const rootFolder: Folder = await folderModelSchema.findOne({
      user_id: user_id,
      is_delete: false,
      folderName: "My Folder",
      parentFolderId: "/",
    });

    if (!rootFolder) {
      throw new Error(`Could not find root folder`);
    }

    const folder: Folder = await folderModelSchema.aggregate([
      {
        $match: {
          user_id: user_id,
          is_delete: false,
          _id: rootFolder._id,
        },
      },
      {
        $lookup: {
          from: "files",
          foreignField: "_id",
          localField: "files",
          as: "files",
        },
      },
      {
        $project: {
          user_id: 1,
          business_id: 1,
          company_id: 1,
          folderName: 1,
          parentFolderId: 1,
          parentFoldersList: 1,
          created_by: 1,
          modified_by: 1,
          date_created: 1,
          date_modified: 1,
          files: {
            $filter: {
              input: "$files",
              as: "f",
              cond: {
                $ne: ["$$f.is_delete", true],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "folders",
          pipeline: [
            {
              $match: {
                parentFolderId: rootFolder._id.toString(),
                is_delete: false,
              },
            },
          ],
          as: "folders",
        },
      },
      {
        $project: {
          is_delete: 0,
          __v: 0,
          "parentFoldersList._id": 0,
          "files.is_delete": 0,
          "files.__v": 0,
          "folders.files": 0,
          "folders.__v": 0,
          "folders.is_delete": 0,
          "folders.parentFoldersList": 0,
        },
      },
    ]);

    if (folder.length === 0) {
      throw new Error("Folder does not exist");
    }

    return res.status(200).json({ data: folder });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const getFolderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let folder: Folder;

    folder = await folderModelSchema.findOne({
      user_id: user_id,
      is_delete: false,
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!folder) {
      throw new Error("Folder does not exist");
    }

    const parentFoldersList: Array<ParentFoldersList> =
      folder.parentFoldersList.slice(1);

    for (let i = 0; i < parentFoldersList.length; i++) {
      folder = await folderModelSchema.findOne({
        user_id: user_id,
        is_delete: false,
        _id: new mongoose.Types.ObjectId(parentFoldersList[i].folderId),
      });

      if (!folder) {
        throw new Error("Folder does not exist");
      }
    }

    folder = await folderModelSchema.aggregate([
      {
        $match: {
          user_id: user_id,
          is_delete: false,
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "files",
          foreignField: "_id",
          localField: "files",
          as: "files",
        },
      },
      {
        $project: {
          user_id: 1,
          business_id: 1,
          company_id: 1,
          folderName: 1,
          parentFolderId: 1,
          parentFoldersList: 1,
          created_by: 1,
          modified_by: 1,
          date_created: 1,
          date_modified: 1,
          files: {
            $filter: {
              input: "$files",
              as: "f",
              cond: {
                $ne: ["$$f.is_delete", true],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "folders",
          pipeline: [
            {
              $match: {
                parentFolderId: id,
                is_delete: false,
              },
            },
          ],
          as: "folders",
        },
      },
      {
        $project: {
          is_delete: 0,
          __v: 0,
          "parentFoldersList._id": 0,
          "files.is_delete": 0,
          "files.__v": 0,
          "folders.files": 0,
          "folders.__v": 0,
          "folders.is_delete": 0,
          "folders.parentFoldersList": 0,
        },
      },
    ]);

    return res.status(200).json({ data: folder });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const renameFolderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newFolderName } = req.body;

    //Updating the Folder Name
    const folder: Folder = await folderModelSchema.findByIdAndUpdate(
      {
        user_id: user_id,
        is_delete: false,
        _id: new mongoose.Types.ObjectId(id),
      },
      {
        folderName: newFolderName.trim(),
        date_modified: moment(),
      },
      { new: true }
    );

    //Updating the Parent Folder's List
    await folderModelSchema.updateMany(
      {
        user_id: user_id,
        "parentFoldersList.folderId": id,
      },
      {
        "parentFoldersList.$.parentFolderName": newFolderName.trim(),
        date_modified: moment(),
      }
    );

    return res.status(200).json({ status: "success", data: folder });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const addFilesToFolder = async (req: any, res: Response) => {
  try {
    const folder: Folder = await folderModelSchema.findOne({
      user_id: user_id,
      is_delete: false,
      _id: req.params.id,
    });

    if (!folder) {
      throw new Error("Folder Does Not Exist");
    }

    let filesArray: Array<FileInterface> = [];

    for (const file of req.files) {
      const fileName = `${accessToken}-${file.originalname}`;
      const downloadUrl = await uploadToFirestore(
        file.mimetype,
        file.buffer,
        fileName,
        accessToken
      );

      if (downloadUrl) {
        const newFile = await fileModelSchema.create({
          user_id: user_id,
          business_id: business_id,
          company_id: company_id,
          folderId: folder._id,
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
        folder.files.push(newFile._id);
      }
    }

    await folder.save();
    res.status(200).json({ data: filesArray });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const addGoogleDriveFilesToFolder = async (req: any, res: Response) => {
  try {
    const files: {
      id: string;
      mimeType: string;
      name: string;
      temp: "GOOGLE FILE" | "OTHER FILE";
      extension: string;
    }[] = req.body;

    const { folderId } = req.params;

    let folder: Folder = await folderModelSchema.findOne({
      user_id: user_id,
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
          user_id: user_id,
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
    console.log("errrr", error);
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const addOneDriveFilesToFolder = async (req: any, res: Response) => {
  try {
    const files = req.body;

    const { folderId } = req.params;

    let folder: Folder = await folderModelSchema.findOne({
      user_id: user_id,
      is_delete: false,
      _id: folderId,
    });

    if (!folder) {
      throw new Error("Folder Does Not Exist");
    }

    let filesArray: Array<FileInterface> = [];

    for (const file of files) {
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
          user_id: user_id,
          business_id: business_id,
          company_id: company_id,
          folderId: folder._id,
          fileType: mimeType,
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
    console.log("errrr", error);
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const renameFileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newFileName } = req.body;

    const file: FileInterface = await fileModelSchema.findOneAndUpdate(
      {
        user_id: user_id,
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
    const { fileIds, currentFolderId, moveFolderId } = req.body;

    await fileModelSchema.updateMany(
      {
        user_id: user_id,
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
        user_id: user_id,
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
        user_id: user_id,
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
    const { id } = req.params;
    const { fileIds } = req.body;

    const folder: Folder = await folderModelSchema.findById(id);

    if (folder === null) {
      throw new Error("Folder or File does not exist");
    }

    const result = await fileModelSchema.updateMany(
      {
        user_id: user_id,
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

export const deleteFoldersByIds = async (req: Request, res: Response) => {
  try {
    const { folderIds } = req.body;

    const result = await folderModelSchema.updateMany(
      {
        user_id: user_id,
        is_delete: false,
        _id: folderIds,
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

export const getTrash = async (req: Request, res: Response) => {
  try {
    const trashFiles: Array<FileInterface> = await fileModelSchema.aggregate([
      {
        $match: {
          user_id: user_id,
          is_delete: true,
        },
      },
      {
        $addFields: {
          type: "file",
        },
      },
      {
        $project: {
          is_delete: 0,
          __v: 0,
          url: 0,
        },
      },
    ]);

    const trashFolders: Array<Folder> = await folderModelSchema.aggregate([
      {
        $match: {
          user_id: user_id,
          is_delete: true,
        },
      },
      {
        $addFields: {
          type: "folder",
        },
      },
      {
        $project: {
          is_delete: 0,
          __v: 0,
          parentFoldersList: 0,
          files: 0,
        },
      },
    ]);

    const trash: Array<FileInterface | Folder> = [
      ...trashFiles,
      ...trashFolders,
    ].sort(
      (a: FileInterface | Folder, b: FileInterface | Folder) =>
        new Date(b.date_modified).getTime() -
        new Date(a.date_modified).getTime()
    );

    return res.status(200).json({ status: "success", data: trash });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const restoreFilesAndFolders = async (req: Request, res: Response) => {
  try {
    const { restores } = req.body;

    let filesToRootFolder: Array<ObjectId> = [];
    let folderIds: Array<ObjectId> = [];
    let filesToBeRestored: Array<ObjectId> = [];
    let foldersToBeRestored: Array<ObjectId> = [];

    for (let i = 0; i < restores.length; i++) {
      if (restores[i].type === "file") {
        const folder = await folderModelSchema.findOne({
          user_id: user_id,
          _id: restores[i].folderId,
          is_delete: false,
        });

        if (folder) {
          filesToBeRestored.push(restores[i]._id);
        } else {
          const remainingFilesAndFolders = restores.slice(i + 1);
          if (
            !remainingFilesAndFolders.find(
              (item: any) =>
                item.type === "folder" && item._id === restores[i].folderId
            )
          ) {
            filesToRootFolder.push(restores[i]._id);
            folderIds.push(restores[i].folderId);
          } else {
            filesToBeRestored.push(restores[i]._id);
          }
        }
      } else if (restores[i].type === "folder") {
        foldersToBeRestored.push(restores[i]._id);
      }
    }

    if (filesToBeRestored.length > 0) {
      await fileModelSchema.updateMany(
        {
          user_id: user_id,
          _id: filesToBeRestored,
        },
        { is_delete: false, date_modified: moment() },
        { new: true }
      );
    }

    if (foldersToBeRestored.length > 0) {
      await folderModelSchema.updateMany(
        {
          user_id: user_id,
          _id: foldersToBeRestored,
        },
        { is_delete: false, date_modified: moment() },
        { new: true }
      );
    }

    if (filesToRootFolder.length > 0) {
      let rootFolder = await folderModelSchema.findOne({
        user_id: user_id,
        is_delete: false,
        folderName: "My Folder",
        parentFolderId: "/",
      });
      for (let i = 0; i < filesToRootFolder.length; i++) {
        await fileModelSchema.findByIdAndUpdate(
          {
            user_id: user_id,
            _id: filesToRootFolder[i],
          },
          {
            is_delete: false,
            folderId: rootFolder._id,
            date_modified: moment(),
          },
          { new: true }
        );

        await folderModelSchema.findByIdAndUpdate(
          {
            user_id: user_id,
            _id: folderIds[i],
          },
          {
            $pull: {
              files: filesToRootFolder[i],
            },
            $set: {
              date_modified: moment(),
            },
          },
          { new: true }
        );

        rootFolder.files.push(filesToRootFolder[i]);
        rootFolder.date_modified = moment();
      }
      await rootFolder.save();
    }

    return res.status(200).json({
      status: "success",
      foldersToBeRestored,
      filesToBeRestored,
      filesToRootFolder,
      folderIds,
    });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const permanentDeleteFilesAndFolders = async (
  req: Request,
  res: Response
) => {
  try {
    const { deletedItems } = req.body;
    const bucket = admin.storage().bucket();

    let foldersToBeDeleted: Array<ObjectId> = [];
    let filesToBeDeleted: Array<ObjectId> = [];
    let filesToBeDeletedFromFirebase: Array<string> = [];

    for (let i = 0; i < deletedItems.length; i++) {
      if (deletedItems[i].type === "folder") {
        const folderList = await folderModelSchema.find(
          {
            user_id: user_id,
            $or: [
              { _id: deletedItems[i]._id },
              { "parentFoldersList.folderId": deletedItems[i]._id },
            ],
          },
          "_id"
        );

        foldersToBeDeleted = [
          ...foldersToBeDeleted,
          ...folderList.map((folder: any) => folder._id),
        ];

        const filesList = await fileModelSchema.find({
          user_id: user_id,
          folderId: {
            $in: foldersToBeDeleted,
          },
        });

        filesToBeDeletedFromFirebase = [
          ...filesToBeDeletedFromFirebase,
          ...filesList.map((file: any) => file.uploadedFileName),
        ];
      } else if (deletedItems[i].type === "file") {
        filesToBeDeletedFromFirebase.push(deletedItems[i].uploadedFileName);
        filesToBeDeleted.push(deletedItems[i]._id);
      }
    }

    if (foldersToBeDeleted.length > 0) {
      await folderModelSchema.deleteMany({
        user_id: user_id,
        _id: {
          $in: foldersToBeDeleted,
        },
      });

      await fileModelSchema.deleteMany({
        user_id: user_id,
        folderId: {
          $in: foldersToBeDeleted,
        },
      });
    }

    if (filesToBeDeleted.length > 0) {
      await fileModelSchema.deleteMany({
        user_id: user_id,
        _id: {
          $in: filesToBeDeleted,
        },
      });

      await folderModelSchema.updateMany(
        {
          user_id: user_id,
          files: {
            $in: filesToBeDeleted,
          },
        },
        {
          $pull: {
            files: {
              $in: filesToBeDeleted,
            },
          },
        }
      );
    }

    for (let uploadFilename of filesToBeDeletedFromFirebase) {
      await bucket.file(uploadFilename).delete();
    }

    return res.status(200).json({
      status: "success",
      message: "Foldes And Files Successfully Deleted",
      foldersToBeDeleted,
      filesToBeDeleted,
      filesToBeDeletedFromFirebase,
    });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const searchFilesAndFoldersByName = async (
  req: Request,
  res: Response
) => {
  try {
    const { searchValue } = req.body;
    const folders = await folderModelSchema.find({
      user_id: user_id,
      is_delete: false,
      folderName: {
        $regex: searchValue || "",
        $options: "i",
      },
    });

    const files = await fileModelSchema.find({
      user_id: user_id,
      is_delete: false,
      fileName: {
        $regex: searchValue || "",
        $options: "i",
      },
    });

    return res.status(200).json({ status: "success", folders, files });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};
