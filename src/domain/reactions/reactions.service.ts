import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ReactionsService {
  constructor(protected databaseService: DatabaseService) {}

  async toggleReaction(
    userId: string,
    messageId: string,
    value: string,
  ): Promise<string> {
    // Check if the message exists
    const message = await this.databaseService.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if the user is a member of the workspace (or authorized)
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: message.workspaceId },
      },
    });

    if (!member) {
      throw new UnauthorizedException('User is not authorized');
    }

    // Check if the reaction already exists for the user
    const existingReaction = await this.databaseService.reaction.findFirst({
      where: {
        messageId,
        memberId: userId,
        value,
      },
    });

    if (existingReaction) {
      // Remove the reaction if it exists
      await this.databaseService.reaction.delete({
        where: { id: existingReaction.id },
      });
      return existingReaction.id;
    } else {
      // Add a new reaction
      const newReaction = await this.databaseService.reaction.create({
        data: {
          value,
          memberId: userId,
          messageId,
          workspaceId: message.workspaceId,
        },
      });
      return newReaction.id;
    }
  }
}
