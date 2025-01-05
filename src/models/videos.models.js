import mongoose, { model } from "mongoose"

const videoSchema = new Schema (
    {
        videoFile : {
            type : String, // cloudnary url
            required : true
        },
        Thumbnail : {
            type : String, 
            required : true
        },
        title : {
            type : String, 
            required : true
        },
        description : {
            type : String,
            required : true
        },
        duration : {
            type : String, // cloudnary url
            required : true
        },
        views : {
            type : Number,
            default: 0,
        },
        isPublished : {
            type : String, // cloudnary url
            required : true
        },
        thumbnail : {
            type: String, 
            required : true
        }
    }, { timestamps: true}
)

export const Video = mongoose.model("Video",videoSchema);