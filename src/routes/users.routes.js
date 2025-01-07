import { Router } from "express";
import { registerUser } from "../controller/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    // (req, res, next) => {
    //     // Log the entire request body and files
    //     // console.log('Request Body:', req.body); // Log the request body (e.g., form fields)
    //     console.log('Files:', req.files); // Log the processed files in req.files

    //     // Continue to the next middleware (registerUser)
    //     next();
    // },
    registerUser
)

export default router;