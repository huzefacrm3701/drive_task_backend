const mongoose = require("mongoose");
const UserModel = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
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
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
            "Please fill a valid email address",
        ],
    },
    password: {
        type: String,
        required: true,
    },
});
