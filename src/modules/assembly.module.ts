

import { Module } from '@nestjs/common';

import { NotificationModule } from './notification/notification.module';

import { TransactionModule } from './transaction/transaction.module';
import { WatchModule } from './watch/watch.module';
import { SuggestionsComplaints } from 'src/infrastructure/entities/suggestions-complaints/suggestions-complaints.entity';
import { SuggestionsComplaintsModule } from './suggestions-complaints/suggestions-complaints.module';
import { StaticPageModule } from './static-page/static-page.module';
import { ContactUsModule } from './contact-us/contact-us.module';
import { FaqModule } from './faq/faq.module';
import { SendEmailModule } from './send-email/send-email.module';

@Module({
  imports: [
  
    NotificationModule,
    SuggestionsComplaintsModule,
    StaticPageModule,
    ContactUsModule,
    FaqModule,
    SendEmailModule, 
    TransactionModule,
    WatchModule,
  ],
  exports: [],
})
export class AssemblyModule {}
