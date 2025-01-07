import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors"



const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, // allows other domain websites to interact with our server if 
    // set to CORS_ORING = * then it allows every domain 
    credentials: true
}))
app.use(express.json({limit:"16kb"})) // parses the incoming json body like forms etc 
app.use(express.urlencoded({extended:true,limit:"16kb"})) // parses the incoming json within the url 
app.use(express.static("public")) // serves the static info like images,css, js for public 
app.use(cookieParser()) // allows the websites to send cookies with our request

// Routes 
import userRouter from "./routes/users.routes.js"
app.use("/api/v1/users",userRouter);



export default app;