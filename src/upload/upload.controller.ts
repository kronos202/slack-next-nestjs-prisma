import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Post('uploads')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, callback) => {
        if (!RegExp(/\/(jpg|jpeg|png|gif|webp)$/).exec(file.mimetype)) {
          return callback(new Error('File type not supported'), false);
        }
        callback(null, true);
      },
    }),
  ) // Tối đa 10 file
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('userId') userId: string,
    @Body('propertyId') propertyId: string,
  ) {
    return await this.uploadService.uploadImages(files, userId, propertyId);
  }

  @Post('uploads')
  @UseInterceptors(
    FilesInterceptor('file', 1, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, callback) => {
        if (!RegExp(/\/(jpg|jpeg|png|gif|webp)$/).exec(file.mimetype)) {
          return callback(new Error('File type not supported'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFiles() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    return await this.uploadService.uploadAvatar(file, userId);
  }
}
