import mongoose from "mongoose";

import { DB_NAME } from "../constant.js";


const connectDB = async()=>{
    try {
        const connection_instance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log(`\n MONGODB is connected!! DB HOST: ${connection_instance.connection.host}`)
    } catch (error) {
        console.log("Mongodb connection error",error);
        process.exit(1);
    }
}

export default connectDB;