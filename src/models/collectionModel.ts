const mongoose = require("mongoose");

const collectionModel = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },

  business_id: {
    type: String,
    required: true,
  },

  company_id: {
    type: String,
    required: true,
  },

  collectionType: {
    type: String,
    enum: ["Internal", "External"],
    required: true,
  },

  collectionName: {
    type: String,
    required: true,
  },

  collectionDetails: {
    type: String,
    required: false,
  },

  collectionNotes: {
    type: String,
    required: false,
  },

  collectionLink: {
    type: String,
    required: true,
  },

  chosenFolderId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Folder",
  },

  usersSubmitted: [
    {
      userId: {
        type: String,
        required: true,
      },
      files: [
        {
          file: {
            type: mongoose.Types.ObjectId,
            required: true,
            ref: "File",
          },
          dateSubmitted: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      lastSubmission: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  seperateFolder: {
    type: Boolean,
    default: false,
  },

  fileSizeLimit: {
    type: Number,
    enum: [
      1 * 1024,
      10 * 1024,
      100 * 1024,
      1 * 1024 * 1024,
      5 * 1024 * 1024,
      10 * 1024 * 1024,
      25 * 1024 * 1024,
    ],
    default: 100 * 1024,
  },

  linkExpirationLimit: {
    type: Date,
    required: true,
    default: function () {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    },
  },

  notifyUser: {
    type: Boolean,
    required: false,
  },

  created_by: {
    type: String,
    required: false,
  },

  modified_by: {
    type: String,
    required: false,
  },

  date_created: {
    type: Date,
  },

  date_modified: {
    type: Date,
  },

  is_delete: {
    type: Boolean,
    default: false,
  },
});

export const collectionModelSchema = mongoose.model(
  "Collection",
  collectionModel
);
