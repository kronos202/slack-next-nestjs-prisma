import { Controller, Body, Patch, Param, Request, Post } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':messageId/toggle')
  async toggleReaction(
    @Param('messageId') messageId: string,
    @Body() body: { value: string },
    @Request() request,
  ) {
    return this.reactionsService.toggleReaction(
      request.user.id,
      messageId,
      body.value,
    );
  }
}
