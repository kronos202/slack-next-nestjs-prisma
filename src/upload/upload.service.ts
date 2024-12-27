import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryResponse } from 'src/utils/types/cloudinary-response';

@Injectable()
export class UploadService {
  constructor(
    private readonly database: DatabaseService,
    private readonly cloudinary: CloudinaryProvider,
  ) {}

  async uploadImages(
    files: Express.Multer.File[],
    userId?: string,
    propertyId?: string,
  ): Promise<any[]> {
    const cloudinary = this.cloudinary.getInstance();

    // Upload từng ảnh lên Cloudinary
    const uploadPromises = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'airbnb/images', resource_type: 'image' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          );
          uploadStream.end(file.buffer);
        }),
    );

    const uploadResults: any[] = await Promise.all(uploadPromises);

    // Lưu metadata vào bảng Image
    const imageRecords = uploadResults.map((result) => ({
      id: result.public_id,
      url: result.secure_url,
      userId,
      propertyId,
    }));

    // await this.database.image.createMany({
    //   data: imageRecords,
    // });

    return imageRecords;
  }

  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<any> {
    const cloudinary = this.cloudinary.getInstance();

    const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'airbnb/avatars', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      uploadStream.end(file.buffer);
    });

    // Lưu thông tin avatar vào bảng User
    await this.database.user.update({
      where: { id: userId },
      data: { avatar: result.secure_url },
    });

    return {
      id: result.public_id,
      url: result.secure_url,
    };
  }

  async deleteImage(publicId: string): Promise<void> {
    const cloudinary = this.cloudinary.getInstance();
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok') {
        throw new BadRequestException(
          `Failed to delete image with public ID: ${publicId}`,
        );
      }
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
