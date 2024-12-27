import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  controllers: [],
  providers: [UploadService, CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class UploadModule {}
