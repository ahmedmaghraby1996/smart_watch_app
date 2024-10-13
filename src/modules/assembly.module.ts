

import { Module } from '@nestjs/common';

import { NotificationModule } from './notification/notification.module';

import { TransactionModule } from './transaction/transaction.module';
import { WatchModule } from './watch/watch.module';

@Module({
  imports: [
  
    NotificationModule,
   
    TransactionModule,
    WatchModule,
  ],
  exports: [],
})
export class AssemblyModule {}
