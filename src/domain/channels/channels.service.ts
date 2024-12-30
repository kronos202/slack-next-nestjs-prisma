import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ChannelsService {
  constructor(protected databaseService: DatabaseService) {}

  async createChannel(
    createChannelDto: CreateChannelDto,
    userId: string,
    workspaceId: string,
  ) {
    const { name, isPrivate } = createChannelDto;
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') throw new Error('Unauthorized');

    const channel = await this.databaseService.channel.create({
      data: {
        name: name.replace(/\s/g, '-').toLowerCase(),
        workspaceId,
        isPrivate,
      },
    });

    return channel.id;
  }

  async updateChannel(
    updateChannelDto: UpdateChannelDto,
    userId: string,
    channelId: string,
  ) {
    const { isPrivate, name } = updateChannelDto;
    const channel = await this.databaseService.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) throw new Error('Channel not found');

    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    const updatedChannel = await this.databaseService.channel.update({
      where: { id: channelId },
      data: { name, isPrivate },
    });

    return updatedChannel;
  }

  async removeChannel(userId: string, channelId: string) {
    const channel = await this.databaseService.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) throw new Error('Channel not found');

    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    const messages = await this.databaseService.message.findMany({
      where: { channelId },
    });

    for (const message of messages) {
      await this.databaseService.message.delete({
        where: { id: message.id },
      });
    }

    await this.databaseService.channel.delete({
      where: { id: channelId },
    });

    return {
      message: 'Delete thành công',
    };
  }

  // workspace-channel.service.ts
  async getCurrentChannel(userId: string, workspaceId: string) {
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) return null;

    const channels = await this.databaseService.channel.findMany({
      where: { workspaceId },
    });

    return channels;
  }

  // workspace-channel.service.ts
  async getChannelById(userId: string, channelId: string) {
    const channel = await this.databaseService.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) return null;

    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
    });

    if (!member) return null;

    return channel;
  }

  async getMessagesInChannel(channelId: string, limit: number = 50) {
    return this.databaseService.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async checkChannelAccess(channelId: string, userId: string) {
    const channel = await this.databaseService.channel.findUnique({
      where: { id: channelId },
      include: { workspace: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found.');
    }

    const member = await this.databaseService.member.findFirst({
      where: { workspaceId: channel.workspaceId, userId },
    });

    if (!member) {
      throw new UnauthorizedException('User is not part of the workspace.');
    }

    return member;
  }
}
