import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
 
const userSchema = new Schema(
    {
        username:{
            type : String,
            required: true,
            unique:true,
            lowercase : true,
            trim : true,
            index : true
        }, 
        email:{
            type : String,
            required: true,
            unique:true,
            lowercase : true,
            trim : true,
        }, 
        fullName :{
            type : String,
            required: true, 
            trim : true,
            index : true
        }, 
        avatar : {
            type : String,
            required : true,

        },
        coverImage : {
             type : String // cloudary int 
        },
        // watchHistory : {
        //      type : Schema.Types.ObjectId,
        //      ref : "Video"
        // }, // this is from video
        watchHistory: [{ // this is from chatgpt
            type: Schema.Types.ObjectId,
            ref: "Video",
            default: []
        }],
        
        password : {
             type : String, 
             required: [true, 'password is required'],
        },

        refreshToken : {
             type : String
        }


    }, {
        timestamps: true,
    }
)
// pre middleware "implements before the saving the info"
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
   this.password = await bcrypt.hash(this.password,10)
   next()
})


// methods 

// checking is password correct 
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

// generate access token 
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}

export const User = mongoose.model("User",userSchema)