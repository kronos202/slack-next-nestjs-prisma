import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ConversationsService {
  constructor(protected databaseService: DatabaseService) {}

  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.databaseService.conversation.findUnique({
      where: { id: conversationId },
      include: {
        memberOne: true,
        memberTwo: true,
        workspace: true,
      },
    });

    if (!conversation) throw new NotFoundException('No conversation found');

    // Kiểm tra nếu user là thành viên trong cuộc trò chuyện
    if (
      conversation.memberOne.userId !== userId &&
      conversation.memberTwo.userId !== userId
    ) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    return conversation;
  }

  async createOrGetConversation(
    workspaceId: string,
    memberId: string,
    userId: string,
  ) {
    const currentMember = await this.databaseService.member.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    const otherMember = await this.databaseService.member.findUnique({
      where: { id: memberId },
    });

    if (!currentMember || !otherMember) {
      throw new NotFoundException('Member not found');
    }

    const existingConversation =
      await this.databaseService.conversation.findFirst({
        where: {
          workspaceId,
          OR: [
            { memberOneId: currentMember.id, memberTwoId: otherMember.id },
            { memberOneId: otherMember.id, memberTwoId: currentMember.id },
          ],
        },
      });

    if (existingConversation) {
      return existingConversation.id;
    }

    const newConversation = await this.databaseService.conversation.create({
      data: {
        workspaceId,
        memberOneId: currentMember.id,
        memberTwoId: otherMember.id,
      },
    });

    return newConversation.id;
  }
}
