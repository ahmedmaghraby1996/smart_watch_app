import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { WatchUser } from '../watch-user/watch-user.entity';
import { User } from '../user/user.entity';
import { OwnedEntity } from 'src/infrastructure/base/owned.entity';
import { City } from './city.entity';
import { AcademicStage } from 'src/infrastructure/data/enums/academic-stage.enum';
import { DayHours } from './day-hours';

@Entity()
export class School extends AuditableEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @OneToMany(() => User, (user) => user.school)
  security: User[];
  @OneToMany(() => WatchUser, (watchUser) => watchUser.school)
  watchUsers: WatchUser[];

  @ManyToOne(() => City, (city) => city.schools)
  @JoinColumn()
  city: City;
  @Column({nullable:true})
  city_id:string;

  @Column()
  city_code:string

  @Column({enum:AcademicStage,type:'enum'})
  academic_stage:AcademicStage

  @ManyToMany(()=>DayHours)
  @JoinTable()
  day_hours:DayHours[]
  constructor(partial: Partial<School>) {
    super();
    Object.assign(this, partial);
  }
  
}
