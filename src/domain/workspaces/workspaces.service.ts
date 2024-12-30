import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WorkspacesService {
  constructor(protected databaseService: DatabaseService) {}

  async joinWorkspace(userId: string, joinCode: string) {
    // Tìm workspace dựa trên joinCode
    const workspace = await this.databaseService.workspace.findUnique({
      where: { joinCode: joinCode.toLowerCase() }, // Xử lý joinCode không phân biệt chữ hoa/chữ thường
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const workspaceId = workspace.id;

    const existingMember = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId: workspaceId,
          userId: userId,
        },
      },
    });

    if (existingMember) throw new Error('Already a member of this workspace.');

    const member = await this.databaseService.member.create({
      data: {
        userId,
        workspaceId,
        role: 'MEMBER',
      },
    });

    return member;
  }

  async newJoinCode(userId: string, workspaceId: string) {
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId: workspaceId,
          userId: userId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') throw new Error('Unauthorized');

    const joinCode = this.generateWorkspaceCode();

    await this.databaseService.workspace.update({
      where: { id: workspaceId },
      data: { joinCode },
    });

    return joinCode;
  }

  async createWorkspace(userId: string, name: string) {
    const joinCode = this.generateWorkspaceCode();

    const workspace = await this.databaseService.workspace.create({
      data: {
        name,
        memberId: userId,
        joinCode,
      },
    });

    // Add admin member
    await this.databaseService.member.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: 'ADMIN',
      },
    });

    // Create default channel
    await this.databaseService.channel.create({
      data: {
        name: 'general',
        workspaceId: workspace.id,
      },
    });

    return workspace;
  }

  async getWorkspaces(userId: string) {
    const members = await this.databaseService.member.findMany({
      where: { userId },
    });

    const workspaceIds = members.map((member) => member.workspaceId);

    const workspaces = await this.databaseService.workspace.findMany({
      where: {
        id: {
          in: workspaceIds,
        },
      },
      include: {
        Channel: true,
      },
    });

    return workspaces;
  }

  // workspace.service.ts
  async updateWorkspace(userId: string, workspaceId: string, name: string) {
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    const updatedWorkspace = await this.databaseService.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });

    return updatedWorkspace;
  }

  // workspace.service.ts
  async removeWorkspace(userId: string, workspaceId: string) {
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    // Delete related entities
    await this.databaseService.member.deleteMany({
      where: { workspaceId },
    });

    await this.databaseService.channel.deleteMany({
      where: { workspaceId },
    });

    await this.databaseService.conversation.deleteMany({
      where: { workspaceId },
    });

    await this.databaseService.message.deleteMany({
      where: { workspaceId },
    });

    await this.databaseService.reaction.deleteMany({
      where: { workspaceId },
    });

    // Finally, delete workspace
    await this.databaseService.workspace.delete({
      where: { id: workspaceId },
    });

    return { message: 'Workspace deleted successfully' };
  }

  // workspace.service.ts
  async getWorkspaceInfoById(userId: string, workspaceId: string) {
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: {
          workspaceId,
          userId,
        },
      },
    });

    const workspace = await this.databaseService.workspace.findUnique({
      where: { id: workspaceId },
    });

    return {
      name: workspace?.name,
      isMember: !!member,
    };
  }

  async checkWorkspaceAccess(workspaceId: string, userId: string) {
    const member = await this.databaseService.member.findFirst({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new UnauthorizedException('Access denied to this workspace.');
    }

    return member;
  }

  async getMembers(workspaceId: string) {
    return this.databaseService.member.findMany({
      where: { workspaceId },
      include: { user: true },
    });
  }

  private async validateMemberRole(
    userId: string,
    workspaceId: string,
    requiredRole: string,
  ) {
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: { workspaceId, userId },
      },
    });

    if (!member || member.role !== requiredRole) {
      throw new UnauthorizedException(`Requires ${requiredRole} role`);
    }

    return member;
  }

  async leaveWorkspace(userId: string, workspaceId: string) {
    const member = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: { workspaceId, userId },
      },
    });

    if (!member) {
      throw new Error('Not a member of this workspace.');
    }

    if (member.role === 'ADMIN') {
      const adminCount = await this.databaseService.member.count({
        where: { workspaceId, role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new Error('Cannot leave workspace as the only admin.');
      }
    }

    await this.databaseService.member.delete({
      where: {
        userId_workspaceId: { workspaceId, userId },
      },
    });

    return { message: 'Left workspace successfully' };
  }

  // async searchWorkspaces(keyword: string) {
  //   return this.databaseService.workspace.findMany({
  //     where: {
  //       name: {
  //         contains: keyword,
  //         mode: 'insensitive',
  //       },
  //     },
  //   });
  // }

  async transferAdminRole(
    userId: string,
    workspaceId: string,
    newAdminId: string,
  ) {
    await this.validateMemberRole(userId, workspaceId, 'ADMIN');

    const newAdmin = await this.databaseService.member.findUnique({
      where: {
        userId_workspaceId: { workspaceId, userId: newAdminId },
      },
    });

    if (!newAdmin) {
      throw new Error('New admin must be a member of the workspace.');
    }

    await this.databaseService.member.update({
      where: {
        userId_workspaceId: { workspaceId, userId },
      },
      data: { role: 'MEMBER' },
    });

    await this.databaseService.member.update({
      where: {
        userId_workspaceId: { workspaceId, userId: newAdminId },
      },
      data: { role: 'ADMIN' },
    });

    return { message: 'Admin role transferred successfully' };
  }

  async addMembers(workspaceId: string, userIds: string[]) {
    const members = userIds.map((userId) => ({
      workspaceId,
      userId,
      role: 'MEMBER',
    }));

    await this.databaseService.member.createMany({ data: members });

    return { message: 'Members added successfully' };
  }

  generateWorkspaceCode() {
    return Array.from(
      { length: 6 },
      () =>
        '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)],
    ).join('');
  }
}
