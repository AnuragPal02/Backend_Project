import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js"

import {User} from "../models/users.model.js"

import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

// generate access and refresh token 

const generateAccessToken_RefreshToken = async(userId)=>{
    try {
             const user = await User.findById(userId);
             const generatedAccessToken = user.generateAccessToken();
             const generatedRefreshToken = user.generateRefreshToken();
             
            //  console.log("generatedAccessToken: ",generatedAccessToken);
            //  console.log("generatedRefreshToken: ",generatedRefreshToken);

             user.refreshToken = generatedRefreshToken;
             await user.save({validateBeforeSave: false});

            //   console.log("generatedAccessToken in function : ",generatedAccessToken);
            //  console.log("generatedRefreshToken in function : ",generatedRefreshToken);
          
             return {generatedAccessToken,generatedRefreshToken}

    } catch (error) {
        throw new ApiError(500, " something went wrong while accessing generating ")
    }
}


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

const loginUser = asyncHandler(async (req,res)=>{
    // take the credentials {username, email, password}
    // check the credentials 
    // validate them { check the password, email, username }
    // access and refresh token 
    // send cookies 
    // login successfull

          const {email, username, password} = req.body // taking elements from the body 
           
          if(!username && !email){
            throw new ApiError(400,"username or email is required..");
          }

          //find username or email from database User
          const user = await User.findOne({
            $or: [{username},{email}]
          });

          // if you didn't find the user 
          if(!user){
            throw new ApiError(404, "user does not exist..");
          };

           
           // if user is found then check his password
          const isPasswordValid = await user.isPasswordCorrect(password);
          if(!isPasswordValid){
            throw new ApiError(401, "Wrong password..");
          }

          const {generatedAccessToken, generatedRefreshToken} = await generateAccessToken_RefreshToken(user._id);

          //  console.log("after function: ",generatedAccessToken);
          //    console.log("after function: ",generatedRefreshToken);
          
          const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

          const options = { // how we are sending cookies like their security 
            httpOnly: true,
            secure: true,
          }

          return res
          .status(200)
          .cookie("accessToken", generatedAccessToken,options)
          .cookie("refreshToken", generatedRefreshToken,options)
          .json(
             new ApiResponse(
                200,// status code 
                { // data 
                    user: loggedInUser, generatedAccessToken, generatedRefreshToken
                }, "user loggedin successfully"// message 
             )
          )     
})

const logOutUser = asyncHandler(async (req,res)=>{

     await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined
        }
      },{
        new: true
      }
     )

     const options = { // how we are sending cookies like their security 
      httpOnly: true,
      secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"user logged Out"))

})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
      throw new ApiError(401,"unauthorised request..");
    }

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.ACCESS_TOKEN_SECRET
      )
  
     const user = await User.findById(decodedToken?._id);
  
     if(!user){
      throw new ApiError(401,"invalid refresh token");
     }
  
     if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used");
     }
  
     const options = {
       httpOnly: true,
       secure: true
     }
     const {generatedAccessToken,generatedRefreshToken} = await generateAccessToken_RefreshToken(user._id);
  
    return res
    .status(200)
    .cookie("accessToken",generatedAccessToken,options)
    .cookie("refreshToken",generatedRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {generatedAccessToken, generatedRefreshToken},
        "access token is refreshed"
      )
    )
    } catch (error) {
       throw new ApiError(401,error?.message || "something wrong while decoding the access token")
    }
})

const changePassword = asyncHandler(async(req,res)=>{
          const {oldPassword, newPassword, confirmPassword} = req.body;

          if(newPassword == confirmPassword){
            throw new ApiError(401,"Password doesn't match with the new password");
          }

        const user = await User.findById(req.user?._id); // authmiddleware lagane ke baad 
        // req me user ka info bhi ajata hai 

       const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword);

       if(!isPasswordCorrect){
        throw new ApiError(401,"Password is not correct..");
       }

       user.password = newPassword;
       user.save({validateBeforeSave: false});
       
       return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"));

})

const getCurrentUser = asyncHandler(async(req,res)=>{
      
      const user = await User.findById(req.user?._id);
      return res.status(200).json(new ApiResponse(200,{user},"user retrived successfully"));
})

const updateAccountDetails = asyncHandler( async(req,res)=>{
     const {fullName, email, username} = req.body;

      if(!fullName && !email){
        throw new ApiError(401,"Fullname and email both are required!");
      }
     const user = await User.findById(req.user?._id);

     user.fullName = fullName;
     user.email = email;
     user.username = username;

     user.save({validateBeforeSave: false});
     
     return res.status(200).json(new ApiResponse(200,{},"changed successfully"));

})

const avatarUpdate = asyncHandler( async(req,res)=>{

    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
      throw new ApiError(401,"File path not found..");
    }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar");
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
         avatar: avatar.url
      }
    },{
      new: true
    }
   ).select("-password -refreshToken")
   return res.status(200).json(new ApiResponse(200,{user},"avatar updated.."));
})

const coverImageUpdate = asyncHandler( async(req,res)=>{
  
  const coverImageLocalPath = req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(401,"File path not found..");
  }

 const coverImage = await uploadOnCloudinary(coverImageLocalPath);
 if(!coverImage.url){
  throw new ApiError(400,"Error while uploading on coverImage");
 }

 const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      coverImage: coverImage.url
    }
  },{
    new: true
  }
 ).select("-password -refreshToken")
 return res.status(200).json(new ApiResponse(200,{user},"coverImage updated.."));
})



export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changePassword,
  coverImageUpdate,
  avatarUpdate,
  updateAccountDetails,
  getCurrentUser,
}