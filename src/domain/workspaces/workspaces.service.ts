import { Injectable } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WorkspacesService {
  constructor(protected databaseService: DatabaseService) {}

  async joinWorkspace(userId: string, workspaceId: string, joinCode: string) {
    const workspace = await this.databaseService.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (workspace.joinCode !== joinCode.toLowerCase()) {
      throw new Error('Invalid join code');
    }

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
        createdBy: userId,
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

  generateWorkspaceCode() {
    return Array.from(
      { length: 6 },
      () =>
        '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)],
    ).join('');
  }
}
