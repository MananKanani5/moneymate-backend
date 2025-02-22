import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, './public/uploads/');
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, Date.now() + path.extname(file.originalname));

  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const allowedTypes = ['image', 'application/pdf'];
  if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
    cb(null, true);
  } else {
    console.log("Unsupported file type");
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
