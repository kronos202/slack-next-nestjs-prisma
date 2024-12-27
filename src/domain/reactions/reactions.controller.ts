import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Patch(':messageId/toggle')
  async toggleReaction(
    @Param('messageId') messageId: string,
    @Body() body: { value: string },
  ): Promise<string> {
    const userId = 'a'; // Replace this with the actual authenticated user's ID
    return this.reactionsService.toggleReaction(userId, messageId, body.value);
  }
}
