import { storage } from "firebase-admin";

export const uploadToFirestore = async (
  mime_type: string,
  arrayBuffer: any,
  fileName: string,
  accessToken: any
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const bucket = storage().bucket();
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
    } catch (err) {
      console.log("errr", err);
      return reject(err);
    }
  });
};

