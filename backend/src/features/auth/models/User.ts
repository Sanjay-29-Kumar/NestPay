import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: ["OWNER", "MANAGER", "TENANT"],
            default: "OWNER",
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        googleId: {
            type: String,
            default: null,
        },

        profilePicture: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;