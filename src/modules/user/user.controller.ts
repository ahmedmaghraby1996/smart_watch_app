import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateFcmRequest } from './dto/update-fcm.request';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { applyQueryIncludes } from 'src/core/helpers/service-related.helper';
import { plainToInstance } from 'class-transformer';
import { UserResponse } from './dto/response/user-response';

// @ApiBearerAuth()
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
// @UseGuards(JwtAuthGuard)
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    @Inject(REQUEST) private request: Request,
  ) {}



  @Get()
  async getAll(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'school');
    const users=await this.userService.findAll(query);
    const usersResponse = users.map((user) => plainToInstance(UserResponse, {...user,school:user.school}, { excludeExtraneousValues: true }));
    const total = await this.userService.count(query);
    return new PaginatedResponse(usersResponse, { meta: { total, ...query } });
  }

  //update fcm token
  @Put('/fcm-token')
  async updateFcmToken(@Body() req: UpdateFcmRequest) {
    const user = await this.userService.findOne(this.request.user.id);
    user.fcm_token = req.fcm_token;
    await this.userService.update(user);
    return new ActionResponse(
      await this.userService.findOne(this.request.user.id),
    );
  }

  //update fcm token
  @Delete('/delete')
  async deleteUser() {
    return new ActionResponse(
      await this.userService.deleteUser(this.request.user.id),
    );
  }
}
