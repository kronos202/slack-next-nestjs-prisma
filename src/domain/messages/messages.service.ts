import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MessagesService {
  constructor(protected databaseService: DatabaseService) {}

  async getMessageById(messageId: string, userId: string) {
    const message = await this.databaseService.message.findUnique({
      where: { id: messageId },
      include: {
        member: true,
        reaction: true,
        parentMessage: true,
        workspace: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const member = await this.databaseService.member.findFirst({
      where: {
        workspaceId: message.workspaceId,
        userId,
      },
    });

    if (!member) {
      throw new UnauthorizedException('User is not a member of the workspace');
    }

    const reactionsWithCount = await this.populateReactions(message.id);
    const thread = await this.populateThread(message.id);

    return {
      ...message,
      reactions: reactionsWithCount,
      thread,
    };
  }

  async populateReactions(messageId: string) {
    const reactions = await this.databaseService.reaction.findMany({
      where: { messageId },
    });

    const reactionsWithCount = reactions.map((reaction) => ({
      ...reaction,
      count: reactions.filter((r) => r.value === reaction.value).length,
    }));

    return reactionsWithCount;
  }

  async populateThread(messageId: string) {
    const threadMessages = await this.databaseService.message.findMany({
      where: { parentMessageId: messageId },
      include: {
        member: true,
      },
    });

    if (threadMessages.length === 0) {
      return { count: 0, image: null, timestamp: 0, name: '' };
    }

    const lastMessage = threadMessages[threadMessages.length - 1];
    const lastMessageMember = await this.databaseService.member.findUnique({
      where: { id: lastMessage.memberId },
    });

    const lastMessageUser = await this.databaseService.user.findUnique({
      where: { id: lastMessageMember?.userId },
    });

    return {
      count: threadMessages.length,
      image: lastMessageUser?.avatar,
      timestamp: lastMessage.createdAt.getTime(),
      name: lastMessageUser?.username,
    };
  }

  async createMessage(
    content: string,
    workspaceId: string,
    imageUrl: string | null,
    channelId: string | null,
    conversationId: string | null,
    parentMessageId: string | null,
    userId: string,
  ) {
    const member = await this.databaseService.member.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!member) {
      throw new UnauthorizedException('User is not a member of the workspace');
    }

    let _conversationId = conversationId;

    // Only possible if replying in a 1:1 conversation
    if (!conversationId && !channelId && parentMessageId) {
      const parentMessage = await this.databaseService.message.findUnique({
        where: { id: parentMessageId },
      });

      if (!parentMessage) {
        throw new NotFoundException('Parent message not found');
      }

      _conversationId = parentMessage.conversationId;
    }

    const newMessage = await this.databaseService.message.create({
      data: {
        content,
        workspaceId,
        imageUrl,
        channelId,
        conversationId: _conversationId,
        memberId: member.id,
        parentMessageId,
      },
    });

    return newMessage.id;
  }

  async updateMessage(messageId: string, content: string, userId: string) {
    const message = await this.databaseService.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const member = await this.databaseService.member.findFirst({
      where: {
        workspaceId: message.workspaceId,
        userId,
      },
    });

    if (!member || member.id !== message.memberId) {
      throw new UnauthorizedException(
        'User is not authorized to edit this message',
      );
    }

    await this.databaseService.message.update({
      where: { id: messageId },
      data: { content, updatedAt: new Date() },
    });

    return messageId;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.databaseService.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const member = await this.databaseService.member.findFirst({
      where: {
        workspaceId: message.workspaceId,
        userId,
      },
    });

    if (!member || member.id !== message.memberId) {
      throw new UnauthorizedException(
        'User is not authorized to delete this message',
      );
    }

    await this.databaseService.message.delete({
      where: { id: messageId },
    });

    return messageId;
  }
}
