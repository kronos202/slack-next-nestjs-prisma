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
  async uploadImages(
    files: Express.Multer.File[],
    userId?: string,
    messageId?: string,
  ): Promise<any[]> {
    const cloudinary = this.cloudinary.getInstance();

    // Upload các hình ảnh lên Cloudinary và lấy thông tin trả về
    const uploadPromises = files.map(
      (file) =>
        new Promise((resolve, reject) => {
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

    // Đợi tất cả các hình ảnh được tải lên
    const uploadResults: any[] = await Promise.all(uploadPromises);

    // Lưu thông tin của hình ảnh vào bảng Image
    const imageRecords = uploadResults.map((result) => ({
      id: result.public_id, // ID của hình ảnh trong Cloudinary
      imageUrl: result.secure_url, // URL của hình ảnh trên Cloudinary
      userId,
      messageId, // Liên kết với messageId nếu có
    }));

    // Lưu thông tin hình ảnh vào cơ sở dữ liệu
    await this.database.image.createMany({
      data: imageRecords,
    });

    return imageRecords;
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
