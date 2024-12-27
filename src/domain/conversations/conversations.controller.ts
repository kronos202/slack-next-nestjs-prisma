import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get(':id')
  async getConversation(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.conversationsService.getConversationById(id, userId);
  }

  @Post('createOrGet')
  async createOrGetConversation(
    @Body('workspaceId') workspaceId: string,
    @Body('memberId') memberId: string,
    @Query('userId') userId: string,
  ) {
    return this.conversationsService.createOrGetConversation(
      workspaceId,
      memberId,
      userId,
    );
  }
}
