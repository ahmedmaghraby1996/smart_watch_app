//create notification controller
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { NotificationResponse } from '../dto/notification.response';
import { ToggleRequest } from '../dto/toggle.request';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from 'src/modules/authentication/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/authentication/guards/roles.guard';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from 'src/modules/authentication/guards/roles.decorator';
import { ActionResponse } from 'src/core/base/responses/action.response';

@ApiBearerAuth()
@ApiTags('Notifications')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT, Role.ADMIN,Role.DRIVER, Role.SECURITY)
  async findAll(@Query() query: PaginatedRequest) {
    let result = await this.notificationService.findAllOwned(query);
    result = this._i18nResponse.entity(result);
    const response = plainToInstance(NotificationResponse, result, {
      excludeExtraneousValues: true,
    });
    if (query.page && query.limit) {
      const total = await this.notificationService.count(query);
      return new PaginatedResponse<NotificationResponse[]>(response, {
        meta: { total, ...query },
      });
    } else {
      return new ActionResponse<NotificationResponse[]>(response);
    }
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT)
  markAs(@Body() req: ToggleRequest, @Param('id') id: string) {
    let result = this.notificationService.toggleRead(req.isRead, id);
    result = this._i18nResponse.entity(result);
    const response = plainToInstance(NotificationResponse, result, {
      excludeExtraneousValues: true,
    });
    return new ActionResponse<NotificationResponse>(response);
  }

}
