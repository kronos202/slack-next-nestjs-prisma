import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { DatabaseService } from 'src/database/database.service';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class MessagesService {
  constructor(
    protected databaseService: DatabaseService,
    private readonly uploadService: UploadService,
  ) {}

  async getMessagesByConversation(
    conversationId: string,
    workspaceId: string,
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const member = await this.databaseService.member.findFirst({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new UnauthorizedException('User is not a member of the workspace');
    }

    const conversation = await this.databaseService.conversation.findFirst({
      where: { id: conversationId, workspaceId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in the workspace');
    }

    const messages = await this.databaseService.message.findMany({
      where: { conversationId, workspaceId },
      include: {
        member: {
          include: { user: true },
        },
        reaction: true,
        Image: true,
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalMessages = await this.databaseService.message.count({
      where: { conversationId, workspaceId },
    });

    return {
      messages,
      totalMessages,
      totalPages: Math.ceil(totalMessages / pageSize),
      currentPage: page,
    };
  }

  async getMessageById(messageId: string, userId: string) {
    const message = await this.databaseService.message.findUnique({
      where: { id: messageId },
      include: {
        member: true,
        reaction: true,
        parentMessage: true,
        workspace: true,
        Image: true,
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
    // const reactions = await this.databaseService.reaction.findMany({
    //   where: { messageId },
    // });

    // const reactionsWithCount = reactions.map((reaction) => ({
    //   ...reaction,
    //   count: reactions.filter((r) => r.value === reaction.value).length,
    // }));

    const reactionsWithCount = await this.databaseService.reaction.groupBy({
      by: ['value'],
      where: { messageId },
      _count: true,
    });

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
  async createMessageWithImages(
    workspaceId: string,
    userId: string,
    content?: string,
    files?: Express.Multer.File[],
    channelId?: string,
    conversationId?: string,
    parentMessageId?: string,
  ) {
    // Kiểm tra member
    const member = await this.databaseService.member.findFirst({
      where: { workspaceId, userId },
    });
    if (!member) {
      throw new UnauthorizedException('User is not a member of the workspace');
    }

    let _conversationId = conversationId;

    if (!conversationId && !channelId && parentMessageId) {
      const parentMessage = await this.databaseService.message.findUnique({
        where: { id: parentMessageId },
      });
      if (!parentMessage) {
        throw new NotFoundException('Parent message not found');
      }
      _conversationId = parentMessage.conversationId;
    }

    // Song song tạo message và upload ảnh
    const [newMessage, uploadResults] = await Promise.all([
      // Tạo message
      this.databaseService.message.create({
        data: {
          content,
          workspaceId,
          channelId,
          conversationId: _conversationId,
          memberId: member.id,
          parentMessageId,
        },
      }),

      // Upload ảnh (nếu có)
      files && files.length > 0
        ? this.uploadService.uploadImagesToCloudinary(files)
        : Promise.resolve([]),
    ]);

    // Lưu thông tin ảnh vào bảng Image
    if (uploadResults?.length > 0) {
      const imageRecords = uploadResults.map((result) => ({
        id: result.public_id,
        imageUrl: result.secure_url,
        userId,
        messageId: newMessage.id,
      }));

      await this.databaseService.image.createMany({
        data: imageRecords,
      });
    }

    return {
      messageId: newMessage,
      images: uploadResults,
    };
  }

  async createMessage(
    workspaceId: string,
    userId: string,
    content?: string,
    imageUrl?: string,
    channelId?: string,
    conversationId?: string,
    parentMessageId?: string,
  ) {
    const member = await this.databaseService.member.findFirst({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new UnauthorizedException('User is not a member of the workspace');
    }

    let _conversationId = conversationId;

    if (!conversationId && !channelId && parentMessageId) {
      const parentMessage = await this.databaseService.message.findUnique({
        where: { id: parentMessageId },
      });

      if (!parentMessage) {
        throw new NotFoundException('Parent message not found');
      }

      _conversationId = parentMessage.conversationId;
    }

    // Kiểm tra workspaceId
    const workspace = await this.databaseService.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Kiểm tra channelId
    if (channelId !== undefined) {
      console.log('channelId:', channelId);
      console.log('channelId:', channelId);

      const channel = await this.databaseService.channel.findUnique({
        where: { id: channelId },
      });
      if (!channel) {
        throw new NotFoundException('Channel not found');
      }
    }

    // Kiểm tra conversationId
    if (_conversationId) {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: _conversationId },
      });
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    }

    // Tạo message
    const newMessage = await this.databaseService.message.create({
      data: {
        content,
        workspaceId,
        channelId,
        conversationId: _conversationId,
        memberId: member.id,
        parentMessageId,
      },
    });

    return newMessage.id;
  }

  async updateMessage(messageId: string, content?: string, userId?: string) {
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

  async countMessagesInConversation(conversationId: string) {
    return this.databaseService.message.count({
      where: { conversationId },
    });
  }

  async searchMessages(
    workspaceId: string,
    userId: string,
    keyword: string,
    conversationId?: string,
    channelId?: string,
  ) {
    const member = await this.databaseService.member.findFirst({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new UnauthorizedException('User is not a member of the workspace');
    }

    const messages = await this.databaseService.message.findMany({
      where: {
        workspaceId,
        conversationId,
        channelId,
        content: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      include: {
        member: {
          include: { user: true },
        },
        reaction: true,
        Image: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return messages;
  }

  async getMessageStatistics(conversationId: string, workspaceId: string) {
    const totalMessages = await this.databaseService.message.count({
      where: { conversationId, workspaceId },
    });

    const topSenders = await this.databaseService.message.groupBy({
      by: ['memberId'],
      where: { conversationId, workspaceId },
      _count: {
        memberId: true,
      },
      orderBy: {
        _count: {
          memberId: 'desc',
        },
      },
      take: 5, // Lấy top 5 người gửi nhiều nhất
    });

    const topReactions = await this.databaseService.reaction.groupBy({
      by: ['value'], // Cột cần group
      where: {
        message: {
          conversationId, // Điều kiện trong liên kết
        },
      },
      _count: {
        value: true, // Đếm số lượng từng loại phản ứng
      },
      orderBy: {
        _count: {
          value: 'desc', // Sắp xếp theo số lượng giảm dần
        },
      },
      take: 5, // Lấy top 5 loại phản ứng
    });

    return {
      totalMessages,
      topSenders,
      topReactions,
    };
  }

  // async countMessagesInWorkspace(workspaceId: string) {
  //   return this.databaseService.message.count({
  //     where: { workspaceId },
  //   });
  // }

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
