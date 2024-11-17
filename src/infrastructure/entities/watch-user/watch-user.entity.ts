import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { School } from '../school/school.entity';
import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { IMEI_entity } from './IMEI.entity';
import { OwnedEntity } from 'src/infrastructure/base/owned.entity';
import { User } from '../user/user.entity';
import { WatchRequest } from './watch-request.entity';

@Entity()
export class WatchUser extends AuditableEntity {
  @ManyToOne(() => User, (user) => user.children)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @OneToMany(() => WatchRequest, (watchRequest) => watchRequest.watch_user)
  requests: WatchRequest[];
  @Column()
  parent_id: string;


  @Column()
  phone:string


  // @ManyToOne(() => User, (user) => user.clients)
  // @JoinColumn({ name: 'driver_id' })
  // driver: User;

  // @Column({ nullable: true })
  // driver_id: string;

  @ManyToMany(() => User, (user) => user.clients)
  drivers: User[];

  @OneToOne(() => IMEI_entity, (imei) => imei.watch_user)
  @JoinColumn({ name: 'imei_id' })
  IMEI: IMEI_entity;
  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ nullable: true })
  birth_date: string;
  @Column({ nullable: true, length: 500 })
  avatar: string;

  @ManyToOne(() => School, (school) => school.watchUsers)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ nullable: true })
  school_id: string;
}
