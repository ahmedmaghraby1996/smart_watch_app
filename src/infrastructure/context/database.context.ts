import { Otp } from '../entities/auth/otp.entity';
import { User } from '../entities/user/user.entity';
import { Address } from '../entities/user/address.entity';



import { Transaction } from '../entities/wallet/transaction.entity';
import { Wallet } from '../entities/wallet/wallet.entity';
import { NotificationEntity } from '../entities/notification/notification.entity';
import { WatchUser } from '../entities/watch-user/watch-user.entity';
import { IMEI } from '../entities/watch-user/IMEI.entity';
import { School } from '../entities/school/school.entity';
import { WatchRequest } from '../entities/watch-user/watch-request.entity';



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
  IMEI
  
];

export const DB_VIEWS = [];
