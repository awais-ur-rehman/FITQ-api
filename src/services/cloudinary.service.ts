import cloudinary from '../config/cloudinary';
import ApiError from '../utils/apiError';

export interface CloudinaryUploadResult {
  imageUrl: string;
  thumbnailUrl: string;
  publicId: string;
}

class CloudinaryService {
  async uploadScanImage(buffer: Buffer, userId: string): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `FITQ/${userId}`, resource_type: 'image' },
        (error, result) => {
          if (error || !result) {
            reject(new ApiError(500, 'Image upload failed'));
            return;
          }
          const thumbnailUrl = cloudinary.url(result.public_id, {
            width: 400,
            crop: 'fill',
            quality: 'auto',
            format: 'auto',
            secure: true,
          });
          resolve({
            imageUrl: result.secure_url,
            thumbnailUrl,
            publicId: result.public_id,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async uploadAvatarImage(buffer: Buffer): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'FITQ/avatars',
          resource_type: 'image',
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error || !result) {
            reject(new ApiError(500, 'Avatar upload failed'));
            return;
          }
          resolve({
            imageUrl: result.secure_url,
            thumbnailUrl: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}

export default new CloudinaryService();
