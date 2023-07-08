import { Request, Response } from "express";
import { ErrorResponse } from "../interfaces/errorInterface";

import { cloudPickerModelSchema } from "../models/cloudPickerModel";
import { CloudPickerInterface } from "../interfaces/cloudPickerInterface";

const moment = require("moment");

export const createCloudPickerUser = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id } = req.body;

    const cloudPickerUser: CloudPickerInterface = new cloudPickerModelSchema({
      user_id,
      business_id,
      company_id,
      created_by: user_id,
      modified_by: "",
      date_created: moment(),
      date_modified: moment(),
      is_delete: false,
    });

    await cloudPickerUser.save();

    res.status(200).json({ status: "success", data: cloudPickerUser });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const storeAccessToken = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      business_id,
      company_id,
      picker,
      access_token: accessToken,
    } = req.headers;

    const cloudPickerUser = await cloudPickerModelSchema.findOneAndUpdate(
      {
        user_id,
        business_id,
        company_id,
        is_delete: false,
      },
      {
        [`${picker}PickerAccessToken`]: accessToken,
        date_modified: moment(),
      }
    );

    res.status(200).json({ status: "success", data: cloudPickerUser });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const getAccessToken = async (req: Request, res: Response) => {
  try {
    const { user_id, business_id, company_id, picker } = req.headers;

    const cloudPickerUser: CloudPickerInterface =
      await cloudPickerModelSchema.findOne({
        user_id,
        business_id,
        company_id,
        is_delete: false,
      });

    if (!cloudPickerUser) throw new Error("Cloud picker user not found");

    console.log(cloudPickerUser[`${picker}PickerAccessToken`]);

    res.status(200).json({
      status: "success",
      data: { accessToken: cloudPickerUser[`${picker}PickerAccessToken`] },
    });
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = { error: (error as Error).message };
    return res.status(400).json(errorResponse);
  }
};

export const getGoogleAuthURL = (req: Request, res: Response) => {
  const { user_id, business_id, company_id } = req.headers;
};
