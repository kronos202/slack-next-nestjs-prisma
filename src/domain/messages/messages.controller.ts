import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':id')
  async getMessage(@Param('id') id: string, @Query('userId') userId: string) {
    return this.messagesService.getMessageById(id, userId);
  }

  @Post()
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Query('userId') userId: string,
  ) {
    return this.messagesService.createMessage(
      createMessageDto.content,
      createMessageDto.workspaceId,
      createMessageDto.image,
      createMessageDto.channelId,
      createMessageDto.conversationId,
      createMessageDto.parentMessageId,
      userId,
    );
  }

  @Put(':id')
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
