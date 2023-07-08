import { ObjectId } from "mongoose";

export interface CloudPickerInterface {
  _id: ObjectId;
  userId: string;
  businessId: string;
  companyId: string;
  googlePickerAcccessToken: string;
  oneDrivePickerAccessToken: string;
  dropboxPickerAccessToken: string;
  created_by: string;
  modified_by: string;
  date_created: Date;
  date_modified: Date;
  is_delete: boolean;
  save(): Promise<this>;
}
