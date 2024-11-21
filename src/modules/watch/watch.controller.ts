import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
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
import { IMEI_entity } from 'src/infrastructure/entities/watch-user/IMEI.entity';
import { IMEIService, WatchRequestService } from './watch-request.service';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import {
  applyQueryFilters,
  applyQueryIncludes,
  applyQueryISDeleted,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { WatchRequestResponse } from './dto/response/watch-request.response';
import { UserResponse } from '../user/dto/response/user-response';
import { WatchUserResponse } from './dto/response/watch-user.response';
import { ConfirmRequest } from './dto/requests/confirm-request';
import { toUrl } from 'src/core/helpers/file.helper';

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
    private readonly _request_service: WatchRequestService,
    private readonly _IMEI_service: IMEIService,

    @Inject(REQUEST) private readonly request: Request,
  ) {}

  @Roles(Role.ADMIN)
  @Post('insert/:IMEI')
  async insert(@Param('IMEI') IMEI: string) {
    return new ActionResponse(
      await this._service.IMEI_repo.save(new IMEI_entity({ IMEI: IMEI })),
    );
  }

  @Roles(Role.ADMIN)
  @Post('edit/:id/:IMEI')
  async editIMEI(@Param('IMEI') IMEI: string, @Param('id') id: string) {
    const IEMI = await this._service.IMEI_repo.findOne({ where: { id: id } });
    if (!IEMI) throw new Error('IMEI not exist');
    IEMI.IMEI = IMEI;
    return new ActionResponse(await this._service.IMEI_repo.save(IEMI));
  }

  @Roles(Role.ADMIN)
  @Delete('delete-IMEI/:id')
  async deleteIMEI(@Param('id') id: string) {
    const IEMI = await this._service.IMEI_repo.findOne({
      where: { id: id },
      relations: { watch_user: true },
    });
    if (!IEMI) throw new Error('IMEI not exist');
    if (IEMI.watch_user) throw new Error('IMEI has watch user');
    return new ActionResponse(await this._service.IMEI_repo.delete(IEMI.id));
  }

  @Roles(Role.ADMIN)
  @Get('get-all-IMEI')
  async getAll(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'watch_user');
    const IMEI = await this._IMEI_service.findAll(query);
    const total = await this._IMEI_service.count(query);
    const result = IMEI.map((IMEI) => {
      return {
        id: IMEI.id,
        IMEI: IMEI.IMEI,
        watch_user: plainToInstance(WatchUserResponse, IMEI.watch_user, {}),
      };
    });
    return new PaginatedResponse(result, { meta: { total: total, ...query } });
  }

  @Get('get-IMEI/:id')
  async getIEMI(@Param('id') id: string) {
    const IMEI = await this._IMEI_service._repo.findOne({
      where: { id: id },
      relations: { watch_user: { parent: true, school: true, drivers: true } },
    });
    return new ActionResponse({
      id: IMEI.id,
      IMEI: IMEI.IMEI,
      watch_user: plainToInstance(WatchUserResponse, IMEI.watch_user),
    });
  }

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

  @Roles(Role.PARENT, Role.DRIVER)
  @Post('make-request/:watch_user_id')
  async makeRequest(@Param('watch_user_id') watch_user_id: string) {
    return new ActionResponse(await this._service.makeRequest(watch_user_id));
  }

  @Roles(Role.SECURITY)
  @Post('confirm-request')
  async confirmRequest(@Body() req: ConfirmRequest) {
    return new ActionResponse(await this._service.confirmRequest(req));
  }

  @Roles(Role.PARENT, Role.DRIVER)
  @Get('/get-users')
  async getWatchUsers() {
    return new ActionResponse(
      plainToInstance(WatchUserResponse, await this._service.getWatchUsers()),
    );
  }

  @Roles(Role.PARENT)
  @Delete('/delete-watch-user/:watch_user_id')
  async deleteWatchUsers(@Param('watch_user_id') watch_user_id: string) {
    return new ActionResponse(
      await this._service._repo.softDelete({
        id: watch_user_id,
        parent_id: this.request.user.id,
      }),
    );
  }

  @Roles(Role.ADMIN)
  @Get('/get-admin-requests')
  async getWatchRequests(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
    applyQueryIncludes(query, 'watch_user#school.drivers.parent');
    applyQuerySort(query, 'created_at=desc');

    const requests = await this._request_service.findAll(query);
    const total = await this._request_service.count(query);
    const result = plainToInstance(WatchRequestResponse, requests, {});
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }
  @Roles(Role.PARENT, Role.DRIVER, Role.SECURITY)
  @Get('/get-users-requests')
  async getWatchUsersRequests(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
    applyQuerySort(query, 'created_at=desc');
    applyQueryISDeleted(query);
    applyQueryIncludes(query, 'watch_user#school.drivers.parent');
    const role = this.request.user.roles[0];
    switch (role) {
      case Role.DRIVER:
        applyQueryFilters(
          query,
          `watch_user.driver_id=${this.request.user.id}`,
        );
        break;
      case Role.PARENT:
        applyQueryFilters(
          query,
          `watch_user.parent_id=${this.request.user.id}`,
        );
        break;
      case Role.SECURITY:
        applyQueryFilters(
          query,
          `watch_user.school_id=${this.request.user.school_id}`,
        );
        break;
      default:
        applyQueryFilters(
          query,
          `watch_user.parent_id=${this.request.user.id}`,
        );
        break;
    }

    const requests = await this._request_service.findAll(query);
    const total = await this._request_service.count(query);
    const result = plainToInstance(WatchRequestResponse, requests, {});
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }
  @Roles(Role.PARENT, Role.DRIVER, Role.SECURITY, Role.School, Role.ADMIN)
  @Get('/get-users-requests/:request_id')
  async getSignleWatchUsersRequests(@Param('request_id') request_id: string) {
    const request = await this._service.getSingleRequest(request_id);
    const response = plainToInstance(WatchRequestResponse, request);
    return new ActionResponse(response);
  }

  @Roles(Role.SECURITY, Role.School)
  @Get('/get-school-users-requests')
  async getSchoolWatchUsersRequests(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
    applyQueryIncludes(query, 'watch_user#school.drivers.parent');
    applyQueryFilters(
      query,
      `watch_user.school_id=${this.request.user.school_id}`,
    );

    const requests = await this._request_service.findAll(query);
    const total = await this._request_service.count(query);
    const result = plainToInstance(WatchRequestResponse, requests, {});
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @Roles(Role.School)
  @Get('/get-school-users')
  async getSchoolWatchUsers(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'school');
    applyQueryIncludes(query, 'drivers');
    applyQueryIncludes(query, 'parent');
    applyQueryFilters(query, `school_id=${this.request.user.school_id}`);
    const watch_users = await this._service.findAll(query);
    const total = await this._service.count(query);
    const result = plainToInstance(WatchUserResponse, watch_users, {});
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @Get('schools')
  async getSchools(@Query('name') name: string) {
    return new ActionResponse(
      (await this._service.getSchools(name)).map((school) => {
        return {
          id: school.id,
          name: school.name,
          avatar: toUrl(school.avatar),
        };
      }),
    );
  }
}
