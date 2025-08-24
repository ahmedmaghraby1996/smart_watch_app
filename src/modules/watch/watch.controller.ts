import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
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
import {
  AddWatchUserRequest,
  EditWatchUserRequest,
} from './dto/requests/add-watch-user.request';
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
import { ImportImeiRequest } from './dto/requests/import-imei.request';

import { app } from 'firebase-admin';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { I18n } from 'nestjs-i18n';
import { I18nResponse } from 'src/core/helpers/i18n.helper';

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
    @InjectRepository(User) private userRepo: Repository<User>,
   @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,

    @Inject(REQUEST) private readonly request: Request,
  ) {}

  @Roles(Role.ADMIN)
  @Post('insert/:IMEI')
  async insert(@Param('IMEI') IMEI: string) {
    return new ActionResponse(
      await this._service.IMEI_repo.save(new IMEI_entity({ IMEI: IMEI })),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @Post('/import/IMEI')
  async importProducts(
    @Body() req: ImportImeiRequest,
    @UploadedFile(new UploadValidator().build())
    file: Express.Multer.File,
  ) {
    req.file = file;
    const products = await this._service.importWatches(req);
    return new ActionResponse(products);
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
      relations: { watch_user: { parent: true, school: true, drivers: true,grade:true } },
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

  @UseInterceptors(ClassSerializerInterceptor, FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @Roles(Role.PARENT)
  @Patch('edit-user')
  async editWatchUser(
    @Body() req: EditWatchUserRequest,
    @UploadedFile(new UploadValidator().build())
    avatarFile: Express.Multer.File,
  ) {
    req.avatarFile = avatarFile;
    const user = await this._service.editWatchUser(req);
    return new ActionResponse(user);
  }

  @Roles(Role.PARENT, Role.DRIVER)
  @Post('make-request/:watch_user_id')
  async makeRequest(@Param('watch_user_id') watch_user_id: string) {
    return new ActionResponse(await this._service.makeRequest(watch_user_id));
  }

  @Roles( Role.PARENT, Role.DRIVER, Role.ADMIN)
  @Post('complete-request')
  async completeRequest(@Body() req: ConfirmRequest) {
    return new ActionResponse(await this._service.completeRequest(req));
  }

  @Roles( Role.School, Role.ADMIN,Role.SECURITY)
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

  @Roles(Role.PARENT,Role.ADMIN)
  @Delete('/delete-watch-user/:watch_user_id')
  async deleteWatchUsers(@Param('watch_user_id') watch_user_id: string) {
    const watch_user = await this._service._repo.findOneBy({
      id: watch_user_id,
    });
    if (!watch_user) throw new Error('user not exist');
    watch_user.IMEI = null;
    await this._service._repo.save(watch_user);
    return new ActionResponse(
      await this._service._repo.softDelete(watch_user.id),
    );
  }

  @Roles(Role.ADMIN)
  @Get('/get-admin-requests')
  async getWatchRequests(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
       applyQueryIncludes(query, 'completed_by');
    applyQueryIncludes(query, 'confirmed_by');
    applyQueryIncludes(query, 'watch_user#school.drivers.parent.grade');
    applyQuerySort(query, 'created_at=desc');
    applyQueryISDeleted(query);
    const last_day = new Date(
      new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
    );
    applyQueryFilters(
      query,
      `created_at>${last_day.toISOString().slice(0, 19).replace('T', ' ')}`,
    );

    const requests = await this._request_service.findAll(query);
    const total = await this._request_service.count(query);
    const response =this._i18nResponse.entity(requests)
    const result = plainToInstance(WatchRequestResponse, response, {});
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }
  @Roles(Role.PARENT, Role.DRIVER, Role.SECURITY)
  @Get('/get-users-requests')
  async getWatchUsersRequests(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
       applyQueryIncludes(query, 'completed_by');
    applyQueryIncludes(query, 'confirmed_by');
    applyQuerySort(query, 'created_at=desc');
    applyQueryISDeleted(query);
    const last_day = new Date(
      new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
    );
    applyQueryFilters(
      query,
      `created_at>${last_day.toISOString().slice(0, 19).replace('T', ' ')}`,
    );

    applyQueryISDeleted(query);
    applyQueryIncludes(query, 'watch_user#school.drivers.parent.grade');
    const role = this.request.user.roles[0];
    switch (role) {
      case Role.DRIVER:
        applyQueryFilters(
          query,
          `watch_user.drivers.id=${this.request.user.id}`,
        );
        break;
      case Role.PARENT:
        applyQueryFilters(
          query,
          `watch_user.parent_id=${this.request.user.id}`,
        );
        break;
      case Role.SECURITY:{
        const grades= await this.userRepo.findOne({
          where: { id: this.request.user.id },
          relations: { grades: true },
        })
     
        applyQueryFilters(query,`school_id=${this.request.user.school_id}`)
        applyQueryFilters(
          query,
          `watch_user.grade_id/${grades.grades.map((grade) => grade.id).toString().replace(/,/g, "_")}`,
        );
        break;}
      default:
        applyQueryFilters(
          query,
          `watch_user.parent_id=${this.request.user.id}`,
        );
        break;
    }

    const requests = await this._request_service.findAll(query);
    const total = await this._request_service.count(query);
    const response =this._i18nResponse.entity(requests)
    const result = plainToInstance(WatchRequestResponse, response, {});
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }
  @Roles(Role.PARENT, Role.DRIVER, Role.SECURITY, Role.School, Role.ADMIN)
  @Get('/get-users-requests/:request_id')
  async getSignleWatchUsersRequests(@Param('request_id') request_id: string) {
    const request = await this._service.getSingleRequest(request_id);
    const result = this._i18nResponse.entity(request);
    const response = plainToInstance(WatchRequestResponse, result);
    return new ActionResponse(response);
  }

  @Roles(Role.SECURITY, Role.School)
  @Get('/get-school-users-requests')
  async getSchoolWatchUsersRequests(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
    applyQueryIncludes(query, 'completed_by');
    applyQueryIncludes(query, 'confirmed_by');
    applyQueryIncludes(query, 'watch_user#school.drivers.parent.grade');
    applyQueryFilters(
      query,
      `watch_user.school_id=${this.request.user.school_id}`,
    );
    applyQueryISDeleted(query);
    const last_day = new Date(
      new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
    );
    applyQueryFilters(
      query,
      `created_at>${last_day.toISOString().slice(0, 19).replace('T', ' ')}`,
    );
    const requests = await this._request_service.findAll(query);
    const total = await this._request_service.count(query);
    const response =this._i18nResponse.entity(requests)
    const result = plainToInstance(WatchRequestResponse, response, {});
    return new PaginatedResponse(result, { meta: { total, ...query } });
  }

  @Roles(Role.School)
  @Get('/get-school-users')
  async getSchoolWatchUsers(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'school');
    applyQueryIncludes(query, 'grade');
    applyQueryIncludes(query, 'drivers');
    applyQueryIncludes(query, 'parent');
    applyQueryFilters(query, `school_id=${this.request.user.school_id}`);
    const watch_users = await this._service.findAll(query);
    const total = await this._service.count(query);
    const response =this._i18nResponse.entity(watch_users)
    const result = plainToInstance(WatchUserResponse, response, {});
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
          academic_stage: school.academic_stage,
        };
      }),
    );

  }
}
