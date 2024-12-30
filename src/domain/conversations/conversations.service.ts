import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { DatabaseService } from 'src/database/database.service';
import { AddParticipantDto } from './dto/add-participant.dto';

@Injectable()
export class ConversationsService {
  constructor(protected databaseService: DatabaseService) {}

  async create(createConversationDto: CreateConversationDto) {
    const { workspaceId, participantIds } = createConversationDto;

    const workspace = await this.databaseService.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    // Kiểm tra tất cả các participant có thuộc workspace không
    const members = await this.databaseService.member.findMany({
      where: {
        workspaceId,
        id: { in: participantIds },
      },
    });

    if (members.length !== participantIds.length) {
      throw new NotFoundException(
        'One or more participants are not part of the workspace.',
      );
    }

    // Tạo conversation
    const conversation = await this.databaseService.conversation.create({
      data: {
        workspaceId,
        participants: {
          create: participantIds.map((id) => ({ memberId: id })),
        },
      },
    });

    return conversation;
  }

  async findAll(workspaceId: string) {
    return this.databaseService.conversation.findMany({
      where: { workspaceId },
      select: {
        id: true,
        participants: {
          select: { memberId: true },
        },
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const conversation = await this.databaseService.conversation.findUnique({
      where: { id },
      include: { participants: true, messages: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return conversation;
  }

  async addParticipant(addParticipantDto: AddParticipantDto) {
    const { conversationId, memberId } = addParticipantDto;

    // Kiểm tra conversation có tồn tại không
    const conversation = await this.databaseService.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    // Thêm participant
    return this.databaseService.conversationParticipant.create({
      data: { conversationId, memberId },
    });
  }

  async removeParticipant(conversationId: string, memberId: string) {
    const participant =
      await this.databaseService.conversationParticipant.findFirst({
        where: { conversationId, memberId },
      });

    if (!participant) {
      throw new NotFoundException(
        'Participant not found in this conversation.',
      );
    }

    return this.databaseService.conversationParticipant.delete({
      where: { id: participant.id },
    });
  }

  async checkAccess(conversationId: string, userId: string) {
    const member = await this.databaseService.member.findFirst({
      where: { userId },
    });

    if (!member) {
      throw new UnauthorizedException('User is not part of the workspace.');
    }

    const participant =
      await this.databaseService.conversationParticipant.findFirst({
        where: { conversationId, memberId: member.id },
      });

    if (!participant) {
      throw new ForbiddenException('Access to this conversation is denied.');
    }

    return participant;
  }

  async getParticipants(conversationId: string) {
    return this.databaseService.conversationParticipant.findMany({
      where: { conversationId },
      include: { member: true },
    });
  }

  async remove(id: string) {
    return this.databaseService.conversation.delete({ where: { id } });
  }
}
