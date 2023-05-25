"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const folderRoutes_1 = __importDefault(require("./routes/folderRoutes"));
const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');
const mongoose = require("mongoose");
const monogoConfig = require("../config/mongoConfig.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET
});
mongoose.connect(monogoConfig.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Mongodb connected successfully");
}).catch((err) => {
    console.log("Mongodb connection issue");
    console.log(err);
    process.exit(1);
});
const app = (0, express_1.default)();
const PORT = 9100;
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({ origin: "*", optionsSuccessStatus: 200 }));
app.use("/folders", folderRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
