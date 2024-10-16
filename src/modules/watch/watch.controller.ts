import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WatchService } from './watch.service';
import { BaseService } from 'src/core/base/service/service.base';
import { WatchUser } from 'src/infrastructure/entities/watch-user/watch-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { REQUEST } from '@nestjs/core';
import { Request, Router } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { UploadValidator } from 'src/core/validators/upload.validator';
import { RegisterRequest } from '../authentication/dto/requests/register.dto';
import { RegisterResponse } from '../authentication/dto/responses/register.response';
import { AddWatchUserRequest } from './dto/requests/add-watch-user.request';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { watch } from 'fs';

@ApiBearerAuth()
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Watch')
@Controller('watch')
export class WatchController {
  constructor(
    private readonly _service: WatchService,

    @Inject(REQUEST) private readonly request: Request,
  ) {}

  @Roles(Role.PARENT)
  @Get('check/:IMEI')
  async checkWatch(@Param('IMEI') IMEI: string) {
    return new ActionResponse(await this._service.checkWatch(IMEI));
  }

  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @Roles(Role.PARENT)
  @Post('add-user')
  async addWatchUser(
    @Body() req: AddWatchUserRequest,
    @UploadedFile(new UploadValidator().build())
    avatarFile: Express.Multer.File,
  ) {
    req.avatarFile = avatarFile;
    const user = await this._service.addWatchUser(req);
    return new ActionResponse(user);
  }

  @Roles(Role.PARENT)
  @Post('make-request')
  async makeRequest(@Param('/:watch_user_id') watch_user_id: string) {
    return new ActionResponse(await this._service.makeRequest(watch_user_id));
  }

  @Roles(Role.PARENT, Role.DRIVER)
  @Get('/get-users')
  async getWatchUsers() {
    return new ActionResponse(await this._service.getWatchUsers());
  }
  @Roles(Role.PARENT, Role.DRIVER)
  @Get('/get-users-requests')
  async getWatchUsersRequests() {
    return new ActionResponse(await this._service.getWatchUsers());
  }

  @Roles(Role.SECURITY)
  @Roles(Role.PARENT, Role.DRIVER)
  @Get('/get-school-users-requests')
  async getSchoolWatchUsersRequests() {
    return new ActionResponse(await this._service.getSchoolWatchUsers());
  }

  @Roles(Role.SECURITY)
  @Get('/get-school-users')
  async getSchoolWatchUsers() {
    return new ActionResponse(await this._service.getWatchUsers());
  }
}
