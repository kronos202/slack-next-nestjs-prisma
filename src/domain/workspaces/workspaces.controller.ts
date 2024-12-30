import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import { RoleEnum } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/role.decorator';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post('join')
  async joinWorkspace(@Body() body: { joinCode: string }, @Request() request) {
    return this.workspacesService.joinWorkspace(request.user.id, body.joinCode);
  }

  @Post('/:workspaceId/new-join-code')
  async newJoinCode(
    @Param('workspaceId') workspaceId: string,
    @Request() request,
  ) {
    return this.workspacesService.newJoinCode(request.user.id, workspaceId);
  }

  @Post('create')
  async createWorkspace(@Body() body: { name: string }, @Request() request) {
    return this.workspacesService.createWorkspace(request.user.id, body.name);
  }

  @Get('get')
  async getWorkspaces(@Request() request) {
    return this.workspacesService.getWorkspaces(request.user.id);
  }

  @Get('info')
  async getWorkspaceInfoById(
    @Query('workspaceId') workspaceId: string,
    @Request() request,
  ) {
    return this.workspacesService.getWorkspaceInfoById(
      request.user.id,
      workspaceId,
    );
  }

  @Patch('update/:workspaceId')
  async updateWorkspace(
    @Body() body: { name: string },
    @Param('workspaceId') workspaceId: string,
    @Request() request,
  ) {
    return this.workspacesService.updateWorkspace(
      request.user.id,
      workspaceId,
      body.name,
    );
  }

  @Delete('remove/:workspaceId')
  @Roles(RoleEnum.ADMIN) // Chỉ owner có thể chuyển quyền sở hữu
  @UseGuards(RoleGuard)
  async removeWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Request() request,
  ) {
    return this.workspacesService.removeWorkspace(request.user.id, workspaceId);
  }
}
