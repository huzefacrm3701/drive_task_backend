import { Request, Response } from "express";
import { ErrorResponse } from "../interfaces/errorInterface";
import { FolderInterface } from "../interfaces/folderInterface";
import { folderModelSchema } from "../models/folderModel";

import mongoose, { Collection, ObjectId } from "mongoose";
import { collectionModelSchema } from "../models/collectionModel";
import { CollectionInterface } from "../interfaces/collectionInterface";

const admin = require("firebase-admin");
const moment = require("moment");

const getUserName = (user_id: string) => {
  switch (user_id) {
    case "6414105397247f2e3d953a29":
      return "Huzefa Multanpurawala";
    case "64902a27fa4da28560dafcb4":
      return "Test File User";
    case "643a38458f0d5e4227629a0e":
      return "Neil Jhaveri";
  }
};

export const createCollection = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const {
      collectionType,
      collectionName,
      collectionDetails,
      collectionNotes,
      chosenFolderId,
      seperateFolder,
      fileSizeLimit,
      linkExpirationLimit,
      notifyUser,
    } = req.body.collection;

    const newCollection: CollectionInterface = new collectionModelSchema({
      user_id,
      business_id,
      company_id,
      collectionType,
      collectionName,
      collectionDetails,
      collectionNotes,
      seperateFolder,
      linkExpirationLimit,
      notifyUser,
    });

    if (chosenFolderId === "") {
      const rootFolder: FolderInterface = await folderModelSchema.findOne({
        user_id,
        business_id,
        company_id,
        is_delete: false,
        folderName: "My Folder",
        parentFolderId: "/",
      });

      if (!rootFolder) {
        throw new Error(`Could not find root folder`);
      }

      const newParentFoldersList = [
        ...rootFolder.parentFoldersList,
        {
          folderId: rootFolder._id,
          parentFolderName: rootFolder.folderName,
        },
      ];
      const newFolder: FolderInterface = await folderModelSchema.create({
        user_id,
        business_id: business_id,
        company_id: company_id,
        folderName: collectionName.trim(),
        parentFolderId: rootFolder._id,
        parentFoldersList: newParentFoldersList,
        files: [],
        created_by: user_id,
        modified_by: "",
        date_created: moment(),
        date_modified: moment(),
        is_delete: false,
      });

      newCollection.chosenFolderId = newFolder._id;
    } else {
      newCollection.chosenFolderId = chosenFolderId;
    }

    const calcualtedSizeLimit =
      Number(fileSizeLimit.split(" ")[0]) *
      (fileSizeLimit.split(" ")[1] === "MB" ? 1024 : 1024 * 1024);

    newCollection.fileSizeLimit = calcualtedSizeLimit;
    newCollection.created_by = getUserName(user_id as string);
    newCollection.date_created = moment();
    newCollection.date_modified = moment();
    newCollection.modified_by = getUserName(user_id as string);
    newCollection.collectionLink = `${req.body.path}/${newCollection._id}`;

    await newCollection.save();

    return res.status(200).json({
      status: "success",
      data: newCollection,
    });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const getAllCollections = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const { filter } = req.params;

    const allCollections: Array<FolderInterface> =
      await collectionModelSchema.aggregate([
        {
          $match: {
            user_id,
            business_id,
            company_id,
            is_delete: false,
            collectionStatus: filter,
          },
        },
        // {
        //   $lookup: {
        //     from: "files",
        //     foreignField: "_id",
        //     localField: "files.file",
        //     as: "files"
        //   }
        // },
        {
          $project: {
            is_delete: 0,
            __v: 0,
          },
        },
      ]);

    return res.status(200).json({ data: allCollections });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const toggleCollectionStatus = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const { id } = req.params;

    const collection: CollectionInterface =
      await collectionModelSchema.findById({
        user_id,
        business_id,
        company_id,
        is_delete: false,
        _id: id,
      });

    collection.collectionStatus =
      collection.collectionStatus === "ACTIVE" ? "COMPLETED" : "ACTIVE";

    collection.date_modified = moment();

    const updatedCollection = await collection.save();

    return res.status(200).json({ status: "success", data: updatedCollection });
  } catch (error) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;

    const { id } = req.params;

    const collection = await collectionModelSchema.findOneAndUpdate(
      {
        user_id,
        business_id,
        company_id,
        is_delete: false,
        collectionStatus: "COMPLETED",
        _id: id,
      },
      {
        is_delete: true,
        date_modified: moment(),
      },
      { new: true }
    );

    return res.status(200).json({ status: "success", data: collection });
  } catch (error) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const checkCollectionValidity = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.headers;
    const { id } = req.params;
    const collection: CollectionInterface = await collectionModelSchema.findOne(
      {
        user_id: user_id,
        business_id: business_id,
        company_id: company_id,
        _id: id,
        collectionStatus: "ACTIVE",
        is_delete: false,
      }
    );

    if (!collection) {
      throw new Error("Collection Link Expired or Collection Doesn't Exists");
    }

    const collectionExpiration =
      new Date(collection.linkExpirationLimit).getTime() > new Date().getTime();

    if (!collectionExpiration) {
      throw new Error("Collection Link Expired or Collection Doesn't Exists");
    }

    return res.status(200).json({ status: "success", data: collection });
  } catch (error) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json({
      status: "failure",
      error: errorResponse,
    });
  }
};

export const deleteAllCollections = async (req: Request, res: Response) => {
  try {
    const deleteCollection = await collectionModelSchema.deleteMany({});
    return res.status(200).json({ status: "success" });
  } catch (error) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};
