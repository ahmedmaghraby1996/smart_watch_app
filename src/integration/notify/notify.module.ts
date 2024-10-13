import { Module } from '@nestjs/common';
import { FcmIntegrationService } from './fcm-integration.service';
import { FcmModule, FcmService } from 'nestjs-fcm';
import { join } from 'path';

@Module({
  imports: [
    FcmModule.forRoot({
  firebaseSpecsPath: join(__dirname, '../../../firebase.spec.json'),
    }),
  ],
  providers: [FcmIntegrationService],
  exports: [FcmIntegrationService],
})
export class NotifyModule {}
