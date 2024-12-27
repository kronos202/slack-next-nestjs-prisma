import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post('create')
  async createChannel(
    @Body() body: { userId: string; workspaceId: string; name: string },
  ) {
    return this.channelsService.createChannel(
      body.userId,
      body.workspaceId,
      body.name,
    );
  }

  @Patch('update')
  async updateChannel(
    @Body() body: { userId: string; channelId: string; name: string },
  ) {
    return this.channelsService.updateChannel(
      body.userId,
      body.channelId,
      body.name,
    );
  }

  @Delete('remove')
  async removeChannel(@Body() body: { userId: string; channelId: string }) {
    return this.channelsService.removeChannel(body.userId, body.channelId);
  }

  @Get('current')
  async getCurrentChannel(
    @Body() body: { userId: string; workspaceId: string },
  ) {
    return this.channelsService.getCurrentChannel(
      body.userId,
      body.workspaceId,
    );
  }

  @Get('get')
  async getChannels(@Body() body: { userId: string; workspaceId: string }) {
    return this.channelsService.getChannelsByWorkspaceId(
      body.userId,
      body.workspaceId,
    );
  }

  @Get('get/:id')
  async getChannelById(
    @Param('id') channelId: string,
    @Body() body: { userId: string },
  ) {
    return this.channelsService.getChannelById(body.userId, channelId);
  }
}
