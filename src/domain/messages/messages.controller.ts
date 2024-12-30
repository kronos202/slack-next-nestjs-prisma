import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Request,
  Patch,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateMessageWithImagesDto } from './dto/create-message-image.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':messageId')
  async getMessage(@Param('messageId') messageId: string, @Request() request) {
    return this.messagesService.getMessageById(messageId, request.user.id);
  }
  @Get('/conversation/:conversationId')
  async getMessagesByConversation(
    @Param('conversationId') conversationId: string,
    @Query('workspaceId') workspaceId: string,
    @Request() request,
  ) {
    return this.messagesService.getMessagesByConversation(
      conversationId,
      workspaceId,
      request.user.id,
    );
  }

  @Post('withImage')
  async createMessage(
    @Body()
    createMessageDto: {
      content?: string;
      workspaceId: string;
      userId: string;
      imageUrl?: string;
      channelId?: string;
      conversationId?: string;
      parentMessageId?: string;
    },
    @Request() request,
  ) {
    console.log('createMessageDto.workspaceId:', createMessageDto.workspaceId);
    console.log('createMessageDto.channelId:', createMessageDto.channelId);

    return await this.messagesService.createMessage(
      createMessageDto.content,
      createMessageDto.workspaceId,
      request.user.id,
      createMessageDto.imageUrl,
      createMessageDto.channelId,
      createMessageDto.conversationId,
      createMessageDto.parentMessageId,
    );
  }
  @Post('create-with-images')
  @UseInterceptors(FilesInterceptor('files')) // Interceptor để upload nhiều file
  async createMessageWithImages(
    @Body() createMessageDto: CreateMessageWithImagesDto,
    @UploadedFiles() files: Express.Multer.File[], // File được gửi lên qua form-data
    @Request() request,
  ) {
    const { workspaceId, content, channelId, conversationId, parentMessageId } =
      createMessageDto;

    try {
      // Tạo message và upload ảnh
      const result = await this.messagesService.createMessageWithImages(
        workspaceId,
        request.user.id,
        content,
        files,
        channelId,
        conversationId,
        parentMessageId,
      );

      return {
        messageId: result.messageId,
        images: result.images,
      };
    } catch (error) {
      // Kiểm tra lỗi và trả về thông báo tương ứng
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Query('userId') userId: string,
  ) {
    return this.messagesService.updateMessage(
      id,
      updateMessageDto.content,
      userId,
    );
  }

  @Delete(':id')
  async deleteMessage(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.messagesService.deleteMessage(id, userId);
  }
}
