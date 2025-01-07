import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises"; // Use promises-based fs for async operations

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.error("Local file path is undefined or null.");
            throw new Error("Local file path is required for upload.");
        }

        // Upload file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // Remove the temporary file after successful upload
        await fs.unlink(localFilePath);
        console.log("Temporary file removed:", localFilePath);

        // Return the response object for further use
        return response;
    } catch (error) {
        console.error("Cloudinary upload failed:", error.message);

        // Attempt to remove the temporary file if it exists
        try {
            await fs.unlink(localFilePath);
            console.log("Temporary file removed after upload failure:", localFilePath);
        } catch (fsError) {
            console.error("Failed to remove temporary file:", fsError.message);
        }

        // Rethrow the error so the calling function knows upload failed
        throw new Error("Cloudinary upload failed.");
    }
};

export { uploadOnCloudinary };
