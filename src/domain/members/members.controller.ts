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
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async getMembers(
    @Query('workspaceId') workspaceId: string,
    @Query('userId') userId: string,
  ) {
    return this.membersService.getMembers(workspaceId, userId);
  }

  @Get(':id')
  async getMemberById(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.membersService.getMemberById(id, userId);
  }

  @Put(':id')
  async updateMemberRole(
    @Param('id') id: string,
    @Body('role') role: RoleEnum,
    @Query('userId') userId: string,
  ) {
    return this.membersService.updateMemberRole(id, role, userId);
  }

  @Delete(':id')
  async removeMember(@Param('id') id: string, @Query('userId') userId: string) {
    return this.membersService.removeMember(id, userId);
  }
}
