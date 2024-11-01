import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { WatchUser } from "./watch-user.entity";
import { OwnedEntity } from "src/infrastructure/base/owned.entity";
import { User } from "../user/user.entity";
@Entity()
export class WatchRequest extends OwnedEntity{
  @ManyToOne(() => User, (user) => user.requests)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => WatchUser, (watchUser) => watchUser.requests)
  @JoinColumn({ name: 'watch_user_id' })
  watchUser: WatchUser 

  @Column()
  watch_user_id: string


  @Column()
  code:number


  
}