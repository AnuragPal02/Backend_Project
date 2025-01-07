import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp') // it is the file path where we store the media and files 
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  })
  
  export const upload = multer({ storage })