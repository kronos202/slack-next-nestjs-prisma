import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
  async joinWorkspace(
    @Body() body: { userId: string; workspaceId: string; joinCode: string },
  ) {
    return this.workspacesService.joinWorkspace(
      body.userId,
      body.workspaceId,
      body.joinCode,
    );
  }

  @Post('new-join-code')
  async newJoinCode(@Body() body: { userId: string; workspaceId: string }) {
    return this.workspacesService.newJoinCode(body.userId, body.workspaceId);
  }

  @Post('create')
  async createWorkspace(@Body() body: { userId: string; name: string }) {
    return this.workspacesService.createWorkspace(body.userId, body.name);
  }

  @Get('get')
  async getWorkspaces(@Body() body: { userId: string }) {
    return this.workspacesService.getWorkspaces(body.userId);
  }

  @Get('info/:id')
  async getWorkspaceInfoById(
    @Param('id') workspaceId: string,
    @Body() body: { userId: string },
  ) {
    return this.workspacesService.getWorkspaceInfoById(
      body.userId,
      workspaceId,
    );
  }

  @Post('update')
  async updateWorkspace(
    @Body() body: { userId: string; workspaceId: string; name: string },
  ) {
    return this.workspacesService.updateWorkspace(
      body.userId,
      body.workspaceId,
      body.name,
    );
  }

  @Post('remove')
  @Roles(RoleEnum.OWNER) // Chỉ owner có thể chuyển quyền sở hữu
  @UseGuards(RoleGuard)
  async removeWorkspace(@Body() body: { userId: string; workspaceId: string }) {
    return this.workspacesService.removeWorkspace(
      body.userId,
      body.workspaceId,
    );
  }
}
