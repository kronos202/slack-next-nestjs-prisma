import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get(':memberId')
  async getMemberById(@Param('memberId') memberId: string, @Request() request) {
    return this.membersService.getMemberById(memberId, request.user.id);
  }

  @Get('/workspace/:workspaceId')
  async getMembersByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Request() request,
  ) {
    return this.membersService.getMembers(workspaceId, request.user.id);
  }

  @Patch(':memberId')
  async updateMemberRole(
    @Param('memberId') memberId: string,
    @Body('role') role: RoleEnum,
    @Request() request,
  ) {
    return this.membersService.updateMemberRole(
      memberId,
      role,
      request.user.id,
    );
  }

  @Delete(':memberId')
  async removeMember(@Param('memberId') memberId: string, @Request() request) {
    return this.membersService.removeMember(memberId, request.user.id);
  }
}
