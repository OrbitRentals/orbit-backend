import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 🔐 Cloudinary config (values come from .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ✅ Correct TS-safe storage config
export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => {
    return {
      folder: 'orbit/vehicles',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 1200, crop: 'limit' }],
    } as any; // 👈 intentional cast (Cloudinary supports this)
  },
});
