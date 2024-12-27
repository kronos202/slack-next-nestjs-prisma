import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { DatabaseService } from 'src/database/database.service';
import { RoleEnum } from 'src/common/enums/role.enum';

@Injectable()
export class MembersService {
  constructor(protected databaseService: DatabaseService) {}

  async getMembers(workspaceId: string, userId: string) {
    const currentMember = await this.getMember(workspaceId, userId);
    if (!currentMember) throw new ForbiddenException('Unauthorized');

    const members = await this.databaseService.member.findMany({
      where: { workspaceId },
      include: { user: true },
    });

    return members;
  }

  async getMemberById(memberId: string, userId: string) {
    const member = await this.databaseService.member.findUnique({
      where: { id: memberId },
      include: { user: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    const currentMember = await this.getMember(member.workspaceId, userId);
    if (!currentMember) throw new ForbiddenException('Unauthorized');

    return member;
  }

  async updateMemberRole(id: string, role: RoleEnum, userId: string) {
    const member = await this.databaseService.member.findUnique({
      where: { id },
    });
    if (!member) throw new NotFoundException('Member not found');

    const currentMember = await this.getMember(member.workspaceId, userId);
    if (!currentMember || currentMember.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    return this.databaseService.member.update({
      where: { id },
      data: { role },
    });
  }

  async removeMember(memberId: string, userId: string) {
    const member = await this.databaseService.member.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException('Member not found');

    const currentMember = await this.getMember(member.workspaceId, userId);
    if (!currentMember || currentMember.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    await this.databaseService.message.deleteMany({ where: { memberId } });
    await this.databaseService.reaction.deleteMany({ where: { memberId } });
    await this.databaseService.conversation.deleteMany({
      where: {
        OR: [{ memberOneId: memberId }, { memberTwoId: memberId }],
      },
    });

    return this.databaseService.member.delete({ where: { id: memberId } });
  }

  private async getMember(workspaceId: string, userId: string) {
    return this.databaseService.member.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
  }
}
