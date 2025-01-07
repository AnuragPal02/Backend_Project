import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js"

import {User} from "../models/users.model.js"

import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    //console.log('Files received by Multer:', req.files);

    const { fullName, email, username, password } = req.body;

if (
  [fullName, email, username, password]
    .map((field) => (typeof field === "string" ? field.trim() : ""))
    .some((field) => field === "")
) {
  throw new ApiError(400, "All fields are required!");
}


    const existedUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existedUser) {
        throw new ApiError(409, "User already exists, you can login!");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("Avatar local path:", avatarLocalPath);
    console.log("Cover image local path:", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Couldn't find the avatar image!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed!");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

export {registerUser}