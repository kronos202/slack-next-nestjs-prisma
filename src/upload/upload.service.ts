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

  // Tải hình ảnh lên Cloudinary và lưu vào cơ sở dữ liệu
  public async uploadImagesToCloudinary(
    files: Express.Multer.File[],
  ): Promise<CloudinaryResponse[]> {
    const cloudinary = this.cloudinary.getInstance();

    const uploadPromises = files.map(
      (file) =>
        new Promise<CloudinaryResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'chat-app/images', resource_type: 'image' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          );
          uploadStream.end(file.buffer);
        }),
    );

    return await Promise.all(uploadPromises);
  }

  // Tải ảnh đại diện lên Cloudinary và lưu vào bảng User
  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<any> {
    const cloudinary = this.cloudinary.getInstance();

    const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'chat-app/avatars', resource_type: 'image' },
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
      id: result.public_id, // ID của hình ảnh trong Cloudinary
      url: result.secure_url, // URL của hình ảnh trên Cloudinary
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
