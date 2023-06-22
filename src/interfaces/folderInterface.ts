import { ObjectId } from "mongoose";

export interface ParentFoldersList {
    folderId: string;
    parentFolderName: string;
}

export interface FolderInterface {
    _id: ObjectId;
    userId: string;
    businessId: string;
    companyId: string;
    folderName: string;
    parentFolderId: string;
    parentFoldersList: ParentFoldersList[],
    files: ObjectId[];
    created_by: string;
    modified_by: string;
    date_created: string;
    date_modified: string;
    is_delete: boolean;
    __v: number;
    type?: 'folder';
    length: number;
    save(): Promise<this>;
}