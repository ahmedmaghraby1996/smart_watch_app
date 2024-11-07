import {
  BadRequestException,
  Inject,
  Injectable,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FcmIntegrationService } from '../../../integration/notify/fcm-integration.service';
import { UserService } from 'src/modules/user/user.service';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import {
  applyQueryFilters,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { GlobalExceptionFilter } from 'src/core/filters/exceptions/global-exception.filter';
import { SendToUsersNotificationRequest } from '../dto/requests/send-to-users-notification.request';

import { NotificationTypes } from 'src/infrastructure/data/enums/notification-types.enum';
import { FirebaseAdminService } from '../firebase-admin-service';
import { sendNotificationRequest } from '../dto/requests/notification-user.dto';

@Injectable()
export class NotificationService extends BaseUserService<NotificationEntity> {
  constructor(
    @InjectRepository(NotificationEntity)
    public _repo: Repository<NotificationEntity>,
    @Inject(REQUEST) request: Request,
    private readonly _userService: UserService,
    private readonly firebaseAdminService: FirebaseAdminService,
    @InjectRepository(User) private readonly _userRepo: Repository<User>,
    private readonly _fcmIntegrationService: FcmIntegrationService,
  ) {
    super(_repo, request);
  }
  //get id and status from argument and update is read
  async toggleRead(isRead: boolean, id: string) {
    const notification = await this._repo.findOneBy({ id: id });
    if (!notification)
      throw new BadRequestException('message.notification_not_found');
    notification.is_read = isRead;
    if (isRead) notification.seen_at = new Date();

    return await this._repo.save(notification);
  }
  override async create(data: NotificationEntity) {
    data.is_read = false;
    data.created_at = new Date();
    const notification = await super.create(data);
    const recipient = await this._userService.findOne({
      id: notification.user_id,
    });
    if (recipient.fcm_token) {
      await this.firebaseAdminService.sendNotification(
        recipient.fcm_token,
        notification['title_' + recipient.language],
        notification['text_' + recipient.language],
   
      );
    }
    if (!notification)
      throw new BadRequestException('message.notification_not_found');
    return notification;
  }
  async sendTousers(data: sendNotificationRequest, users: User[]) {


    const BATCH_SIZE = 500; 
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const userBatch = users.slice(i, i + BATCH_SIZE);
       this.firebaseAdminService.sendNotificationForAll(
        userBatch.map((user) => user.fcm_token),
        data.title,
        data.description,
       
      );
    }
  
    return true;

  
  }
  async getAllMyNotifications() {
    const notifications = await this._repo.find({
      where: { user_id: this.currentUser.id },
    });
    return notifications;
  }
  async findAll(options?: PaginatedRequest): Promise<NotificationEntity[]> {
    applyQueryFilters(options, `user_id=${super.currentUser.id}`);

    applyQuerySort(options, 'created_at=desc');

    return await super.findAll(options);
  }
  async findAllAdmin(
    options?: PaginatedRequest,
  ): Promise<NotificationEntity[]> {
    let query: any;
    if (!isNaN(options.skip)) query = { skip: options.skip };
    if (!isNaN(options.take)) query = { ...query, take: options.take };
    if (options.where && options.where.length)
      query = { ...query, where: options.where };
    if (options.order) query = { ...query, order: options.order };
    if (options.isDeleted) query = { ...query, withDeleted: options.isDeleted };
    if (options.relations) query = { ...query, relations: options.relations };
    if (options.select) query = { ...query, select: options.select };

    return await this._repo.find(query);
  }
}
