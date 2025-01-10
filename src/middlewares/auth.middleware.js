import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.model.js";

export const verifyJWT = asyncHandler(async (req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
      //  console.log(token);
        if(!token){
            throw new ApiError(401,"Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token");
        }
         req.user = user;
         next();
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token");
    }
})


// export const verifyJWT = asyncHandler(async (req, _, next) => {
//     try {
//         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

//         // Check if token is present
//         if (!token) {
//             throw new ApiError(401, "Unauthorized request: Token is missing");
//         }

//         // Validate token structure
//         if (token.split(".").length !== 3) {
//             throw new ApiError(401, "Invalid or malformed token");
//         }

//         // Verify token
//         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

//         // Find user
//         const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
//         if (!user) {
//             throw new ApiError(401, "Invalid access token: User not found");
//         }

//         // Attach user to request
//         req.user = user;
//         next();
//     } catch (error) {
//         console.error("JWT Verification Error:", error.message);
//         throw new ApiError(401, error.message || "Invalid access token");
//     }
// });


