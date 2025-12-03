import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dmk35pgnq',
  api_key: process.env.CLOUDINARY_API_KEY || '891791239813537',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'sNmSOJPP7--RZrugvWbIdjmDvSk',
  secure: true
});

export default cloudinary;

