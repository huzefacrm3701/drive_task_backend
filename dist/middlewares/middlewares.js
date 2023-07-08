"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMimeType = void 0;
const getMimeType = (req, res, next) => {
    const files = req.body;
    const updatedFiles = files.map((file) => {
        switch (file.mimeType) {
            case "application/vnd.google-apps.document":
                return {
                    ...file,
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    extension: ".docx",
                    temp: "GOOGLE FILE",
                };
            case "application/vnd.google-apps.spreadsheet":
                return {
                    ...file,
                    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    extension: ".xlsx",
                    temp: "GOOGLE FILE",
                };
            case "application/vnd.google-apps.presentation":
                return {
                    ...file,
                    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    extension: ".pptx",
                    temp: "GOOGLE FILE",
                };
            case "application/vnd.google-apps.photo":
                return {
                    mimeType: "image/jpeg",
                    extension: ".jpeg",
                    temp: "GOOGLE FILE",
                };
            default:
                return {
                    ...file,
                    extension: file.name.slice(file.name.lastIndexOf('.') + 1),
                    temp: "OTHER FILE",
                };
        }
    });
    req.body = updatedFiles;
    next();
};
exports.getMimeType = getMimeType;
