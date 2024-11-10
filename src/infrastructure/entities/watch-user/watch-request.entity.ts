import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { WatchUser } from "./watch-user.entity";
import { OwnedEntity } from "src/infrastructure/base/owned.entity";
import { User } from "../user/user.entity";
import { RequestStatus } from "src/infrastructure/data/enums/reservation-status.eum";
@Entity()
export class WatchRequest extends OwnedEntity{
  @ManyToOne(() => User, (user) => user.requests)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => WatchUser, (watchUser) => watchUser.requests)
  @JoinColumn({ name: 'watch_user_id' })
  watch_user: WatchUser 

  @Column()
  watch_user_id: string

  @Column({default:RequestStatus.PENDNING})
  status:RequestStatus

  @Column()
  code:number

  @Column({ length: 10, unique: true })
  number: string;
  
}