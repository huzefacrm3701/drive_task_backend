import { ObjectId } from "mongoose";

export interface CollectionInterface {
  _id: ObjectId;
  userId: string;
  businessId: string;
  companyId: string;
  collectionType: "INTERNAL" | "EXTERNAL";
  collectionName: string;
  collectionDetails?: string;
  collectionNotes?: string;
  collectionLink: string;
  collectionStatus: "ACTIVE" | "COMPLETED";
  chosenFolderId: ObjectId;
  usersSubmitted: {
    userId: string;
    files: {
      file: ObjectId;
      dateSubmitted: Date;
    }[];
    lastSubmission: Date;
  }[];
  seperateFolder: boolean;
  fileSizeLimit: number;
  linkExpirationLimit: Date;
  notifyUser: boolean;
  created_by: string;
  modified_by: string;
  date_created: Date;
  date_modified: Date;
  is_delete: boolean;
  save(): Promise<this>;
}
