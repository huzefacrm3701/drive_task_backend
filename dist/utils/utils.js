"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToFirestore = void 0;
const { v4: uuidv4 } = require("uuid");
const firebase_admin_1 = require("firebase-admin");
const uploadToFirestore = async (mime_type, arrayBuffer, fileName, accessToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            const bucket = (0, firebase_admin_1.storage)().bucket();
            const buffer = Buffer.from(arrayBuffer, "base64");
            const metadata = {
                contentType: mime_type,
                metadata: {
                    firebaseStorageDownloadTokens: accessToken,
                },
            };
            const fileRef = bucket.file(fileName);
            const writableStream = fileRef.createWriteStream({
                metadata,
            });
            writableStream.on("error", (err) => {
                return reject(err);
            });
            writableStream.on("finish", async () => {
                const signedUrlResponse = await fileRef.getSignedUrl({
                    action: "read",
                    expires: "03-17-2025",
                });
                const downloadUrl = signedUrlResponse[0];
                return resolve(downloadUrl);
            });
            writableStream.write(buffer);
            writableStream.end();
        }
        catch (err) {
            console.log("errr", err);
            return reject(err);
        }
    });
};
exports.uploadToFirestore = uploadToFirestore;
