import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FcmIntegrationService } from '../../../integration/notify/fcm-integration.service';
import { UserService } from 'src/modules/user/user.service';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { NotificationTypes } from 'src/infrastructure/data/enums/notification-types.enum';

@Injectable()
export class NotificationService extends BaseUserService<NotificationEntity> {
  constructor(
    @InjectRepository(NotificationEntity)
    public _repo: Repository<NotificationEntity>,
    @InjectRepository(User)
    public userRepo: Repository<User>,
    @Inject(REQUEST) request: Request,
    private readonly _userService: UserService,
    private readonly _fcmIntegrationService: FcmIntegrationService,
  ) {
    super(_repo, request);
  }
  //get id and status from argument and update is read
  async toggleRead(isRead: boolean, id: string) {
    const notification = await this._repo.findOneBy({ id: id });
    if (!notification) throw new BadRequestException('message.not_found');
    notification.is_read = isRead;
    if (isRead) notification.seen_at = new Date();
    return await this._repo.save(notification);
  }
  override async create(data: NotificationEntity) {
    data.is_read = false;
    const notification = await super.create(data);
    const recipient = await this._userService.findOne({
      id: notification.user_id,
    });
    console.log('recipient', recipient);

    if (recipient.fcm_token) {
      await this._fcmIntegrationService.send(
        recipient.fcm_token,
        notification['title_' + recipient.language],
        notification['text_' + recipient.language],
        {
          action: notification.type,
          action_id: notification.url,
        },
      );
    }
    if (!notification) throw new BadRequestException('message.not_found');
    return notification;
  }

  //create notification to group of users
  async createToGroup(notification: NotificationEntity, users: User[]) {
    console.log('group sending notification');
    const notifications = [];
    const data = notification;
    users.forEach(async (user: any) => {
      data.user_id = user.id;
      console.log(data);
      const notification = await this.create(data);
      notifications.push(notification);
    });
    return notifications;
  }
  //*This For Test

}
