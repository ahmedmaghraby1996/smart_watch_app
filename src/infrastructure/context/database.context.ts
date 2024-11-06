import { Otp } from '../entities/auth/otp.entity';
import { User } from '../entities/user/user.entity';
import { Address } from '../entities/user/address.entity';



import { Transaction } from '../entities/wallet/transaction.entity';
import { Wallet } from '../entities/wallet/wallet.entity';
import { NotificationEntity } from '../entities/notification/notification.entity';
import { WatchUser } from '../entities/watch-user/watch-user.entity';
import { IMEI_entity } from '../entities/watch-user/IMEI.entity';
import { School } from '../entities/school/school.entity';
import { WatchRequest } from '../entities/watch-user/watch-request.entity';
import { SuggestionsComplaints } from '../entities/suggestions-complaints/suggestions-complaints.entity';
import { FaqQuestion } from '../entities/faq/faq_question';
import { StaticPage } from '../entities/static-pages/static-pages.entity';
import { ContactUs } from '../entities/contact-us/contact-us.entity';



export const DB_ENTITIES = [
  User,
  Address,
  Otp,
  School,
WatchRequest,
  Transaction,
  Wallet,
  NotificationEntity,
  WatchUser,
  IMEI_entity,
  SuggestionsComplaints,
  FaqQuestion,
  StaticPage,
  ContactUs
  
];

export const DB_VIEWS = [];
