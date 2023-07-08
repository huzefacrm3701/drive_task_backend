require("dotenv").config();
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import driveRouter from "./routes/driveRoutes";

// const morgan = require("morgan");

const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

const mongoose = require("mongoose");
const monogoConfig = require("../config/mongoConfig.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET,
});

mongoose
  .connect(monogoConfig.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongodb connected successfully");
  })
  .catch((err: any) => {
    console.log("Mongodb connection issue");
    console.log(err);
    process.exit(1);
  });

const app = express();
const PORT = 9100;

app.use(bodyParser.json());
// app.use(morgan("dev"));
app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));

app.use("/drive", driveRouter);

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
