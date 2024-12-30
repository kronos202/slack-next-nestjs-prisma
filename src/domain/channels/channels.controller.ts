import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  // create channel
  @Post('/:workspaceId')
  async createChannel(
    @Body() createChannelDto: CreateChannelDto,
    @Param('workspaceId') workspaceId: string,
    @Request() request,
  ) {
    return this.channelsService.createChannel(
      createChannelDto,
      request.user.id,
      workspaceId,
    );
  }

  @Patch(':channelId')
  async updateChannel(
    @Body() updateChannelDto: UpdateChannelDto,
    @Param('channelId') channelId: string,
    @Request() request,
  ) {
    return this.channelsService.updateChannel(
      updateChannelDto,
      request.user.id,
      channelId,
    );
  }

  @Delete(':channelId')
  async removeChannel(
    @Param('channelId') channelId: string,
    @Request() request,
  ) {
    return this.channelsService.removeChannel(request.user.id, channelId);
  }

  @Get('/:workspaceId/current')
  async getChannels(
    @Request() request,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.channelsService.getCurrentChannel(request.user.id, workspaceId);
  }

  @Get(':channelId')
  async getChannelById(
    @Param('channelId') channelId: string,
    @Request() request,
  ) {
    return this.channelsService.getChannelById(request.user.id, channelId);
  }
}
