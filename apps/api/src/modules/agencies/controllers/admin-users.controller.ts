import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser, type CurrentUserData } from '../../auth/current-user.decorator';
import { UsersService } from '../../users/users.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user.response';
import { UserPagedQueryDto } from '../dto/user-paged-query.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller('admin/users')
@Roles('admin')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users listed', type: [UserResponseDto] })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async list() {
    return this.usersService.listAll();
  }

  @Get('paged')
  @ApiOperation({ summary: 'List users (paged)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users listed (paged)' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async listPaged(@Query() query: UserPagedQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    return this.usersService.listAllPaged({ limit, offset, role: query.role, search: query.search });
  }

  @Get(':id/detail')
  @ApiOperation({ summary: 'Get user detail with agency and booking stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User detail returned' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getDetail(@Param('id') id: string) {
    const result = await this.usersService.getDetail(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return result;
  }

  @Post('agents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new agent user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Agent created', type: UserResponseDto })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async createAgent(@Req() req: Request, @CurrentUser() caller: CurrentUserData, @Body() body: CreateAgentDto) {
    const user = await this.usersService.createAgent(body);

    await this.auditService.log({
      action: 'admin.create_agent',
      resource: 'user',
      resourceId: user.id,
      agencyId: body.agencyId,
      userId: caller.sub,
      requestId: req.requestId,
      metadata: { email: body.email, agencyId: body.agencyId }
    });

    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated', type: UserResponseDto })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async update(@Req() req: Request, @CurrentUser() caller: CurrentUserData, @Param('id') id: string, @Body() body: UpdateUserDto) {
    const result = await this.usersService.update(id, body);
    await this.auditService.log({
      action: 'admin.update_user',
      resource: 'user',
      resourceId: id,
      userId: caller.sub,
      requestId: req.requestId,
      metadata: { name: body.name, phone: body.phone, agencyId: body.agencyId, role: body.role }
    });
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted', type: UserResponseDto })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async remove(@Req() req: Request, @CurrentUser() caller: CurrentUserData, @Param('id') id: string) {
    const result = await this.usersService.delete(id);
    await this.auditService.log({
      action: 'admin.delete_user',
      resource: 'user',
      resourceId: id,
      userId: caller.sub,
      requestId: req.requestId
    });
    return result;
  }
}
