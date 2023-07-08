import { ObjectId } from "mongoose";

export interface RequestFile {
  buffer: Buffer;
  encoding: string;
  fieldname: string;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface FileInterface {
  _id: ObjectId;
  userId: string;
  businessId: string;
  companyId: string;
  folderId: ObjectId;
  fileType: string;
  fileName: string;
  uploadedFileName: string;
  url: string;
  created_by: string;
  modified_by: string;
  date_created: string;
  date_modified: string;
  is_delete: boolean;
  __v: number;
  type?: "file";
  save(): Promise<this>;
}
