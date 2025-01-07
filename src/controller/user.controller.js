import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js"

import {User} from "../models/users.model.js"
import { upload } from "../middlewares/multer.middleware.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res)=> {
  
    // step - 1 : get user details from frontend 
    // step - 2 : validation 
    // step - 3 : check if user already exist : check username and email both 
    // step - 4 : whether file is there or not like avatar or images or cover images 
    // step - 5 : upload on cloudinary, avatar 
    // step - 6 : create user object - create entry in db
    // step - 7 : remove password and refresh toekn field from response 
    // step - 8 : check for user creation f
    // step - 9 : return res;

    // const {fullName, email, username, password} = req.body
    // console.log("email: ",email);

     const {fullName, email, username, password} = req.body;
    
    
     // if any field is empty return apierror
     if ([fullName, email, username, password].some((field)=>field?.trim() === "")) {
        throw new ApiError(400, "All fields are required!")
     }

     // checking for existing user 
     // $or will apply or function on different fields like username, email and many..
     const existedUser = User.findOne({$or: [{username},{email}]})
     
     if(existedUser){
        throw new ApiError(409,"User already Exits, you can login!");
     }
 
     // take the files or images and upload in on cloudinary 
     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImagePath = req.files?.coverImage[0]?.path;

     if(!avatarLocalPath){
        throw new ApiError(400, "couldn't find the images");
     }
    

     const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImagePath)

     if(!avatar){
        throw new ApiError(400, "Avatar is required!");
     }

    const user = await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase(),
        }
     )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering user")
    }

    // response 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
});

export { registerUser };
