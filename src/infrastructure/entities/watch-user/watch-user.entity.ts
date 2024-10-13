import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { School } from '../school/school.entity';
import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { IMEI } from './IMEI.entity';
import { OwnedEntity } from 'src/infrastructure/base/owned.entity';
import { User } from '../user/user.entity';

@Entity()
export class WatchUser extends AuditableEntity {
  @ManyToOne(() => User, (user) => user.children)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column()
  parent_id: string;


  @ManyToOne(() => User, (user) => user.clients)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ nullable: true })
  driver_id: string;

  @OneToOne(() => IMEI, (imei) => imei.watchUser)
  @JoinColumn({ name: 'imei_id' })
  IMEI: IMEI;
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
