import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import {
  Entity,
  Column,
  BeforeInsert,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Factory } from 'nestjs-seeder';
import { randNum } from 'src/core/helpers/cast.helper';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Language } from 'src/infrastructure/data/enums/language.enum';
import { Address } from './address.entity';

import { NotificationEntity } from '../notification/notification.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Transaction } from '../wallet/transaction.entity';
import { WatchUser } from '../watch-user/watch-user.entity';
import { School } from '../school/school.entity';
import { WatchRequest } from '../watch-user/watch-request.entity';
import { SuggestionsComplaints } from '../suggestions-complaints/suggestions-complaints.entity';
import { Grade } from '../school/grade.entity';
import { City } from '../school/city.entity';

@Entity()
export class User extends AuditableEntity {
  // account > unique id generator 10 numbers)
  @Factory((faker) => faker.phone.number('########'))
  @Column({ length: 8, unique: true })
  account: string;

  @ManyToOne(()=>City,)
  city:City
  @Column({nullable:true})
  city_id:string

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications: NotificationEntity[];

  @Factory((faker) => faker.helpers.unique(faker.internet.domainName))
  @Column({ length: 100, unique: true })
  username: string;

  @Column({ length: 100 })
  name: string;

  @OneToMany(
    () => SuggestionsComplaints,
    (suggestionsComplaints) => suggestionsComplaints.user,
  )
  suggestionsComplaints: SuggestionsComplaints[];

  @OneToMany(() => WatchRequest, (watchRequest) => watchRequest.user)
  requests: WatchRequest[];

  // @Factory((faker, ctx) => faker.internet.password())
  @Column({ nullable: true, length: 60 })
  password: string;

  @Factory((faker, ctx) => faker.internet.email(ctx.name))
  @Column({ nullable: true, length: 100 })
  email: string;

  @Factory((faker) => faker.date.future())
  @Column({ nullable: true })
  email_verified_at: Date;

  @Factory((faker) => faker.phone.number('+965#########'))
  @Column({ nullable: true, length: 20 })
  phone: string;

  @Factory((faker) => faker.date.future())
  @Column({ nullable: true })
  phone_verified_at: Date;

  @Factory((faker) => faker.internet.avatar())
  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Factory((faker) => faker.helpers.arrayElement(Object.values(Gender)))
  @Column({ nullable: true, type: 'enum', enum: Gender })
  gender: Gender;
  @OneToMany(() => WatchUser, (watchUser) => watchUser.parent)
  children: WatchUser[];

  // @OneToMany(() => WatchUser, (watchUser) => watchUser.parent)
  // clients: WatchUser[];

  @ManyToMany(() => WatchUser, (watchUser) => watchUser.drivers)
  @JoinTable({ name: 'watch_user_driver' })
  clients: WatchUser[];

  @Column({ nullable: true, length: 500 })
  fcm_token: string;

  @Column({ nullable: true })
  birth_date: string;

  @ManyToOne(() => School, (school) => school.security)
  school: School;
  @Column({ nullable: true })
  school_id: string;

  @ManyToMany(()=>Grade,)
  @JoinTable()
  grades: Grade[]

  @Column({ type: 'enum', enum: Language, default: Language.EN })
  language: Language;

  @Column({ default: true })
  is_active: boolean;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @ManyToOne(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @Factory((faker) =>
    faker.helpers.arrayElement([Role.PARENT, Role.DRIVER, Role.SECURITY]),
  )
  @Column({ type: 'set', enum: Role, default: [Role.PARENT] })
  roles: Role[];

  @OneToMany(() => Address, (address) => address.user, {
    cascade: true,
  })
  addresses: Promise<Address[]>;

  @OneToMany(() => User, (user) => user.user)
  family: User[];

  @ManyToOne(() => User, (user) => user.family)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  relation_type: string;

  @ManyToMany(()=>User,)
  @JoinTable()
  school_users: User[]
  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }

  // generate unique id in this pattern: ######
  public uniqueIdGenerator(): string {
    return randNum(8);
  }

  @BeforeInsert()
  generateAccount() {
    // ensure the account is unique
    if (!this.account) this.account = this.uniqueIdGenerator();
  }
}
