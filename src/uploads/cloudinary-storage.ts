import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 🔐 Cloudinary config (from .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Multer storage for vehicle images
export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'orbit/vehicles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1600, crop: 'limit' }],
  } as any, // ✅ safe cast (Cloudinary runtime supports this)
});
