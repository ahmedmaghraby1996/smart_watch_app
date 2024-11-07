import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './controllers/notification.controller';
import { FcmIntegrationService } from '../../integration/notify/fcm-integration.service';
import { NotificationService } from './services/notification.service';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { UserService } from '../user/user.service';
import { NotifyModule } from 'src/integration/notify/notify.module';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { FirebaseAdminService } from './firebase-admin-service';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      User
    ]),
    NotifyModule,
  ],
  controllers: [
    NotificationController
  ],
  providers: [
    NotificationService,
    FcmIntegrationService,
    I18nResponse,
    UserService,

  ],
  exports: [
    NotificationModule,
    NotificationService,
 
  ],
})
export class NotificationModule { }
